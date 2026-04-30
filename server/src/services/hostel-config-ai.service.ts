import OpenAI from 'openai';
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions.js';
import type { HostelConfig, UpdateHostelConfigInput, FeatureFlags } from '@smarthostel/shared';
import * as hostelConfigService from '@services/hostel-config.service.js';
import { env } from '@config/env.js';
import { logger } from '@utils/logger.js';
import { AppError } from '@utils/app-error.js';

export interface AiChatInput {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
}

export interface AiChatAction {
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  detail: string;
}

export interface AiChatResult {
  reply: string;
  actions: AiChatAction[];
  config: HostelConfig;
}

/* ── Tool definitions (OpenAI function-calling) ───────────────── */

const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'update_hostel_info',
      description: 'Update top-level hostel identity fields (name, tagline, address, contact email, contact phone). Pass only the fields the user wants to change.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Hostel display name' },
          tagline: { type: 'string' },
          address: { type: 'string' },
          contactEmail: { type: 'string' },
          contactPhone: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_branding',
      description: 'Update site branding: primary or accent color (hex like #1e40af) or logo URL.',
      parameters: {
        type: 'object',
        properties: {
          primaryColor: { type: 'string', description: 'Hex color, e.g. #1e40af' },
          accentColor: { type: 'string', description: 'Hex color, e.g. #f59e0b' },
          logoUrl: { type: 'string' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_pricing',
      description: 'Update security deposit or currency.',
      parameters: {
        type: 'object',
        properties: {
          securityDeposit: { type: 'number' },
          currency: { type: 'string', description: 'ISO 4217 code, e.g. INR' },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'toggle_feature',
      description: 'Enable or disable a single feature module on the site.',
      parameters: {
        type: 'object',
        properties: {
          feature: {
            type: 'string',
            enum: [
              'laundry', 'mess', 'gatePass', 'complaints', 'leaves', 'notices',
              'lostFound', 'sos', 'visitors', 'gamification', 'roomMatching', 'wellness',
            ],
          },
          enabled: { type: 'boolean' },
        },
        required: ['feature', 'enabled'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_room_type_price',
      description: 'Set the per-semester fee on a single room type identified by its key (e.g. DELUXE_AC).',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Room type key, e.g. DELUXE_AC' },
          feePerSemester: { type: 'number' },
        },
        required: ['key', 'feePerSemester'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'set_room_type_prices_by_ac',
      description: 'Bulk update the per-semester fee for ALL room types matching an AC type. Use this when the user says "AC rooms" or "non-AC rooms" without naming a specific type.',
      parameters: {
        type: 'object',
        properties: {
          acType: { type: 'string', enum: ['AC', 'NON_AC'] },
          feePerSemester: { type: 'number' },
        },
        required: ['acType', 'feePerSemester'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_room_type',
      description: 'Add a new room type to the catalog.',
      parameters: {
        type: 'object',
        properties: {
          key: { type: 'string', description: 'Uppercase ID, e.g. PREMIUM_AC' },
          label: { type: 'string' },
          acType: { type: 'string', enum: ['AC', 'NON_AC'] },
          feePerSemester: { type: 'number' },
          capacity: { type: 'number', minimum: 1, maximum: 10 },
        },
        required: ['key', 'label', 'acType', 'feePerSemester', 'capacity'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_room_type',
      description: 'Remove a room type from the catalog by key.',
      parameters: {
        type: 'object',
        properties: { key: { type: 'string' } },
        required: ['key'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_block',
      description: 'Add a new block (residential building/wing).',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Short id, e.g. C' },
          label: { type: 'string' },
          gender: { type: 'string', enum: ['BOYS', 'GIRLS'] },
          floors: { type: 'number', minimum: 1, maximum: 20 },
        },
        required: ['name', 'gender', 'floors'],
        additionalProperties: false,
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'remove_block',
      description: 'Remove a block by its name.',
      parameters: {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
        additionalProperties: false,
      },
    },
  },
];

/* ── Tool handlers ─────────────────────────────────────────────── */

interface ToolContext {
  current: HostelConfig;
  actorId: string;
  correlationId?: string;
}

async function applyUpdate(
  ctx: ToolContext,
  patch: UpdateHostelConfigInput,
): Promise<HostelConfig> {
  const updated = await hostelConfigService.updateConfig(patch, ctx.actorId, ctx.correlationId);
  ctx.current = updated.toObject() as HostelConfig;
  return ctx.current;
}

type ToolHandler = (args: Record<string, unknown>, ctx: ToolContext) => Promise<string>;

const handlers: Record<string, ToolHandler> = {
  async update_hostel_info(args, ctx) {
    const patch = args as UpdateHostelConfigInput['hostel'];
    if (!patch || Object.keys(patch).length === 0) return 'No hostel fields provided.';
    await applyUpdate(ctx, { hostel: patch });
    return `Updated hostel: ${Object.keys(patch).join(', ')}.`;
  },

  async update_branding(args, ctx) {
    const patch = args as UpdateHostelConfigInput['branding'];
    if (!patch || Object.keys(patch).length === 0) return 'No branding fields provided.';
    await applyUpdate(ctx, { branding: patch });
    return `Updated branding: ${Object.keys(patch).join(', ')}.`;
  },

  async update_pricing(args, ctx) {
    const patch = args as UpdateHostelConfigInput['pricing'];
    if (!patch || Object.keys(patch).length === 0) return 'No pricing fields provided.';
    await applyUpdate(ctx, { pricing: patch });
    return `Updated pricing: ${Object.keys(patch).join(', ')}.`;
  },

  async toggle_feature(args, ctx) {
    const feature = args.feature as keyof FeatureFlags;
    const enabled = args.enabled as boolean;
    await applyUpdate(ctx, { features: { [feature]: enabled } as Partial<FeatureFlags> });
    return `Feature "${feature}" is now ${enabled ? 'enabled' : 'disabled'}.`;
  },

  async set_room_type_price(args, ctx) {
    const key = args.key as string;
    const fee = args.feePerSemester as number;
    const found = ctx.current.roomTypes.find((rt) => rt.key === key);
    if (!found) {
      const available = ctx.current.roomTypes.map((rt) => rt.key).join(', ');
      return `Room type "${key}" not found. Available: ${available}.`;
    }
    const next = ctx.current.roomTypes.map((rt) => (rt.key === key ? { ...rt, feePerSemester: fee } : rt));
    await applyUpdate(ctx, { roomTypes: next });
    return `Set ${key} fee to ${fee}.`;
  },

  async set_room_type_prices_by_ac(args, ctx) {
    const acType = args.acType as 'AC' | 'NON_AC';
    const fee = args.feePerSemester as number;
    const matches = ctx.current.roomTypes.filter((rt) => rt.acType === acType);
    if (matches.length === 0) {
      return `No room types with acType=${acType} exist.`;
    }
    const next = ctx.current.roomTypes.map((rt) => (rt.acType === acType ? { ...rt, feePerSemester: fee } : rt));
    await applyUpdate(ctx, { roomTypes: next });
    return `Set fee=${fee} on ${matches.length} ${acType} room type${matches.length === 1 ? '' : 's'} (${matches.map((m) => m.key).join(', ')}).`;
  },

  async add_room_type(args, ctx) {
    const key = (args.key as string).toUpperCase();
    if (ctx.current.roomTypes.some((rt) => rt.key === key)) {
      return `Room type "${key}" already exists.`;
    }
    const newRt = {
      key,
      label: args.label as string,
      acType: args.acType as 'AC' | 'NON_AC',
      feePerSemester: args.feePerSemester as number,
      capacity: args.capacity as number,
      isActive: true,
    };
    await applyUpdate(ctx, { roomTypes: [...ctx.current.roomTypes, newRt] });
    return `Added room type ${key}.`;
  },

  async remove_room_type(args, ctx) {
    const key = args.key as string;
    if (!ctx.current.roomTypes.some((rt) => rt.key === key)) {
      return `Room type "${key}" not found.`;
    }
    const next = ctx.current.roomTypes.filter((rt) => rt.key !== key);
    await applyUpdate(ctx, { roomTypes: next });
    return `Removed room type ${key}.`;
  },

  async add_block(args, ctx) {
    const name = args.name as string;
    if (ctx.current.blocks.some((b) => b.name === name)) {
      return `Block "${name}" already exists.`;
    }
    const newBlock = {
      name,
      label: (args.label as string | undefined) ?? `Block ${name}`,
      gender: args.gender as 'BOYS' | 'GIRLS',
      floors: args.floors as number,
      isActive: true,
    };
    await applyUpdate(ctx, { blocks: [...ctx.current.blocks, newBlock] });
    return `Added block ${name}.`;
  },

  async remove_block(args, ctx) {
    const name = args.name as string;
    if (!ctx.current.blocks.some((b) => b.name === name)) {
      return `Block "${name}" not found.`;
    }
    const next = ctx.current.blocks.filter((b) => b.name !== name);
    await applyUpdate(ctx, { blocks: next });
    return `Removed block ${name}.`;
  },
};

/* ── OpenAI orchestration ─────────────────────────────────────── */

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI | null {
  if (!env.OPENAI_API_KEY) return null;
  if (!openai) openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openai;
}

function buildSystemPrompt(config: HostelConfig): string {
  return [
    'You are the SmartHostel admin AI. The warden is the user and you can edit the hostel configuration on their behalf via the provided tools.',
    'You MUST use a tool whenever the user asks for a configuration change. Do not just describe — call the tool. After the tool returns, give a short confirmation in plain English.',
    'If the request is ambiguous, ask one short clarifying question instead of guessing.',
    'Hex colors must be valid 6- or 3-digit hex like #1e40af. Currency is ISO 4217.',
    '',
    'CURRENT CONFIGURATION SNAPSHOT:',
    JSON.stringify(
      {
        hostel: config.hostel,
        branding: config.branding,
        pricing: config.pricing,
        features: config.features,
        roomTypes: config.roomTypes.map((rt) => ({
          key: rt.key,
          label: rt.label,
          acType: rt.acType,
          feePerSemester: rt.feePerSemester,
          capacity: rt.capacity,
          isActive: rt.isActive,
        })),
        blocks: config.blocks.map((b) => ({ name: b.name, gender: b.gender, floors: b.floors, isActive: b.isActive })),
      },
      null,
      2,
    ),
  ].join('\n');
}

async function runOpenAI(input: AiChatInput, ctx: ToolContext): Promise<AiChatResult> {
  const client = getOpenAI();
  if (!client) throw new AppError('AI_NOT_CONFIGURED', 'OpenAI is not configured', 503);

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: buildSystemPrompt(ctx.current) },
    ...input.history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: input.message },
  ];

  const actions: AiChatAction[] = [];
  let finalReply = '';

  for (let iteration = 0; iteration < 4; iteration++) {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 500,
    });

    const choice = completion.choices[0];
    const msg = choice?.message;
    if (!msg) break;

    messages.push(msg);

    if (!msg.tool_calls || msg.tool_calls.length === 0) {
      finalReply = msg.content?.trim() ?? '';
      break;
    }

    for (const tc of msg.tool_calls) {
      if (tc.type !== 'function') continue;
      const handler = handlers[tc.function.name];
      let detail: string;
      let ok = true;
      let parsedArgs: Record<string, unknown> = {};
      try {
        parsedArgs = JSON.parse(tc.function.arguments || '{}');
      } catch {
        parsedArgs = {};
      }
      if (!handler) {
        detail = `Unknown tool: ${tc.function.name}`;
        ok = false;
      } else {
        try {
          detail = await handler(parsedArgs, ctx);
        } catch (err) {
          ok = false;
          detail = err instanceof Error ? err.message : 'Tool failed';
        }
      }
      actions.push({ tool: tc.function.name, args: parsedArgs, ok, detail });
      messages.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: detail,
      });
    }
  }

  if (!finalReply) finalReply = actions.map((a) => a.detail).join(' ') || 'Done.';

  return { reply: finalReply, actions, config: ctx.current };
}

/* ── Local fallback (regex-based) ─────────────────────────────── */

const FEATURE_KEYS: Array<keyof FeatureFlags> = [
  'laundry', 'mess', 'gatePass', 'complaints', 'leaves', 'notices',
  'lostFound', 'sos', 'visitors', 'gamification', 'roomMatching', 'wellness',
];

function findFeatureKey(token: string): keyof FeatureFlags | null {
  const t = token.toLowerCase().replace(/[\s-]/g, '');
  const map: Record<string, keyof FeatureFlags> = {
    laundry: 'laundry',
    mess: 'mess',
    gatepass: 'gatePass',
    gate: 'gatePass',
    complaints: 'complaints',
    complaint: 'complaints',
    leaves: 'leaves',
    leave: 'leaves',
    notices: 'notices',
    notice: 'notices',
    lostfound: 'lostFound',
    lost: 'lostFound',
    sos: 'sos',
    visitors: 'visitors',
    visitor: 'visitors',
    gamification: 'gamification',
    leaderboard: 'gamification',
    roommatching: 'roomMatching',
    matching: 'roomMatching',
    wellness: 'wellness',
  };
  return map[t] ?? null;
}

async function runLocalFallback(input: AiChatInput, ctx: ToolContext): Promise<AiChatResult> {
  const msg = input.message.trim();
  const lower = msg.toLowerCase();
  const actions: AiChatAction[] = [];

  async function call(tool: string, args: Record<string, unknown>) {
    const handler = handlers[tool];
    if (!handler) return;
    try {
      const detail = await handler(args, ctx);
      actions.push({ tool, args, ok: true, detail });
    } catch (err) {
      actions.push({
        tool,
        args,
        ok: false,
        detail: err instanceof Error ? err.message : 'Tool failed',
      });
    }
  }

  // Patterns are ordered by specificity — first match wins.
  let m: RegExpMatchArray | null;

  // 1. Specific roomType key (e.g. "change DELUXE_AC to 12500"). Runs before
  //    the AC bulk regex so keys ending in _AC don't trigger bulk updates.
  if ((m = msg.match(/(?:change|set|update)\s+([A-Z][A-Z0-9_]+)\s*(?:to|=)\s*([\d,]+)/))
      && ctx.current.roomTypes.some((rt) => rt.key === m![1])) {
    await call('set_room_type_price', { key: m[1], feePerSemester: Number(m[2].replace(/,/g, '')) });
  }
  // 2. AC / Non-AC bulk price. Requires "rooms"/"fee"/"price" after the AC
  //    token to avoid matching inside identifiers like "DELUXE_AC".
  else if ((m = lower.match(/(?:^|[^a-z0-9_])(non[-\s]?ac|ac)\s+(?:rooms?|fees?|prices?)\s+(?:to|=)\s*([\d,]+)/))) {
    const acType = m[1].replace(/[\s-]/g, '').toLowerCase() === 'nonac' ? 'NON_AC' : 'AC';
    await call('set_room_type_prices_by_ac', { acType, feePerSemester: Number(m[2].replace(/,/g, '')) });
  }
  // 3. Hostel name: "rename [hostel] to X", "set hostel name to X", "change name to X"
  else if ((m = msg.match(/(?:rename(?:\s+(?:the\s+)?hostel)?|change\s+(?:the\s+)?(?:hostel\s+)?name|set\s+(?:the\s+)?hostel\s+name|set\s+name)\s+(?:to|=)\s+["“']?([^"”'\n]+?)["”']?\s*$/i))) {
    await call('update_hostel_info', { name: m[1].trim() });
  }
  // 4. Brand colors
  else if ((m = lower.match(/(?:change|set|update)\s+(primary|accent|brand)\s+color\s+(?:to|=)\s+(#?[0-9a-f]{3,6})/))) {
    const which = m[1] === 'accent' ? 'accentColor' : 'primaryColor';
    const hex = m[2].startsWith('#') ? m[2] : `#${m[2]}`;
    await call('update_branding', { [which]: hex });
  }
  // 5. Security deposit
  else if ((m = lower.match(/(?:change|set|update)\s+(?:security\s+)?deposit\s+(?:to|=)\s+([\d,]+)/))) {
    await call('update_pricing', { securityDeposit: Number(m[1].replace(/,/g, '')) });
  }
  // 6. Feature toggle
  else if ((m = lower.match(/\b(disable|turn\s+off|enable|turn\s+on)\b\s+([a-z\s-]+?)(?:\s|$|\.|,)/))) {
    const enabled = !m[1].startsWith('dis') && !m[1].includes('off');
    const feature = findFeatureKey(m[2]);
    if (feature) await call('toggle_feature', { feature, enabled });
  }

  let reply: string;
  if (actions.length === 0) {
    reply = "I couldn't match that request to an action without an AI key. Try things like: 'Change AC rooms to 8500', 'Disable laundry', 'Set primary color to #10b981', or 'Rename hostel to Acme'.";
  } else {
    reply = actions.map((a) => a.detail).join(' ');
  }
  return { reply, actions, config: ctx.current };
}

/* ── Public entry point ───────────────────────────────────────── */

export async function chat(
  input: AiChatInput,
  actorId: string,
  correlationId?: string,
): Promise<AiChatResult> {
  const initial = await hostelConfigService.getConfig();
  const ctx: ToolContext = {
    current: initial.toObject() as HostelConfig,
    actorId,
    correlationId,
  };

  if (!getOpenAI()) {
    logger.info({ actorId }, 'Hostel-config AI: using local fallback (no OpenAI key)');
    return runLocalFallback(input, ctx);
  }

  try {
    return await runOpenAI(input, ctx);
  } catch (err) {
    logger.error(
      { actorId, error: (err as Error).message },
      'Hostel-config AI: OpenAI call failed, falling back to local',
    );
    return runLocalFallback(input, ctx);
  }
}
