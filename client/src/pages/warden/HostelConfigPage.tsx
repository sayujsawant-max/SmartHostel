import { useEffect, useState } from 'react';
import {
  type HostelConfig,
  type RoomTypeConfig,
  type BlockConfig,
  type FeatureFlags,
} from '@smarthostel/shared';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion } from '@components/ui/motion';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import HostelConfigAiChat from '@components/HostelConfigAiChat';
import { useHostelConfig } from '@context/HostelConfigContext';
import {
  Building2,
  Palette,
  ToggleRight,
  IndianRupee,
  BedDouble,
  Layers,
  Save,
  Plus,
  Trash2,
  CreditCard,
} from 'lucide-react';

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-shadow';

const labelCls = 'block text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1';

const sectionCls =
  'rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] p-5 space-y-4';

const headingCls = 'flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))]';

const FEATURE_LABELS: Record<keyof FeatureFlags, string> = {
  laundry: 'Laundry',
  mess: 'Mess',
  gatePass: 'Gate Pass',
  complaints: 'Complaints',
  leaves: 'Leaves',
  notices: 'Notices',
  lostFound: 'Lost & Found',
  sos: 'SOS',
  visitors: 'Visitors',
  gamification: 'Gamification',
  roomMatching: 'Room Matching',
  wellness: 'Wellness',
  payments: 'Payments',
};

function emptyRoomType(): RoomTypeConfig {
  return { key: '', label: '', acType: 'AC', feePerSemester: 0, capacity: 1, isActive: true };
}

function emptyBlock(): BlockConfig {
  return { name: '', gender: 'BOYS', floors: 1, isActive: true };
}

export default function HostelConfigPage() {
  usePageTitle('Hostel Configuration');
  const { config: globalConfig, setConfig: setGlobalConfig, loading: globalLoading } = useHostelConfig();
  const [config, setConfig] = useState<HostelConfig | null>(globalConfig);
  const [saving, setSaving] = useState(false);

  // Sync local edits when the provider's config changes (e.g. AI chat refresh).
  useEffect(() => {
    if (globalConfig) setConfig(globalConfig);
  }, [globalConfig]);

  if (globalLoading || !config) return <PageSkeleton />;

  const update = <K extends keyof HostelConfig>(key: K, value: HostelConfig[K]) => {
    setConfig({ ...config, [key]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch<{ config: HostelConfig }>('/hostel-config', {
        method: 'PATCH',
        body: JSON.stringify({
          hostel: config.hostel,
          branding: config.branding,
          features: config.features,
          pricing: config.pricing,
          roomTypes: config.roomTypes,
          blocks: config.blocks,
          payments: config.payments
            ? {
                provider: config.payments.provider,
                enabled: config.payments.enabled,
                keyId: config.payments.keyId ?? '',
                // Empty keySecret is treated as "no change" by the server.
                keySecret: config.payments.keySecret ?? '',
              }
            : undefined,
        }),
      });
      setConfig(res.data.config);
      setGlobalConfig(res.data.config);
      showSuccess('Hostel configuration saved');
    } catch (err) {
      showError(err, 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Hostel Configuration"
        description="Customize branding, pricing, room types, blocks, and feature toggles."
        icon={<Building2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
        action={
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save changes'}
          </motion.button>
        }
      />

      <HostelConfigAiChat onConfigChange={(next) => { setConfig(next); setGlobalConfig(next); }} />

      {/* Hostel info */}
      <section className={sectionCls}>
        <h3 className={headingCls}>
          <Building2 className="w-4 h-4" /> Hostel info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Name</label>
            <input
              className={inputCls}
              value={config.hostel.name}
              onChange={(e) => update('hostel', { ...config.hostel, name: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Tagline</label>
            <input
              className={inputCls}
              value={config.hostel.tagline ?? ''}
              onChange={(e) => update('hostel', { ...config.hostel, tagline: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Address</label>
            <input
              className={inputCls}
              value={config.hostel.address ?? ''}
              onChange={(e) => update('hostel', { ...config.hostel, address: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Contact email</label>
            <input
              className={inputCls}
              type="email"
              value={config.hostel.contactEmail ?? ''}
              onChange={(e) => update('hostel', { ...config.hostel, contactEmail: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Contact phone</label>
            <input
              className={inputCls}
              value={config.hostel.contactPhone ?? ''}
              onChange={(e) => update('hostel', { ...config.hostel, contactPhone: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Branding */}
      <section className={sectionCls}>
        <h3 className={headingCls}>
          <Palette className="w-4 h-4" /> Branding
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Primary color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={config.branding.primaryColor}
                onChange={(e) =>
                  update('branding', { ...config.branding, primaryColor: e.target.value })
                }
                className="h-10 w-14 rounded border border-[hsl(var(--border))] cursor-pointer"
              />
              <input
                className={inputCls}
                value={config.branding.primaryColor}
                onChange={(e) =>
                  update('branding', { ...config.branding, primaryColor: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Accent color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={config.branding.accentColor}
                onChange={(e) =>
                  update('branding', { ...config.branding, accentColor: e.target.value })
                }
                className="h-10 w-14 rounded border border-[hsl(var(--border))] cursor-pointer"
              />
              <input
                className={inputCls}
                value={config.branding.accentColor}
                onChange={(e) =>
                  update('branding', { ...config.branding, accentColor: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className={labelCls}>Logo URL</label>
            <input
              className={inputCls}
              type="url"
              value={config.branding.logoUrl ?? ''}
              onChange={(e) => update('branding', { ...config.branding, logoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className={sectionCls}>
        <h3 className={headingCls}>
          <IndianRupee className="w-4 h-4" /> Pricing
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Security deposit</label>
            <input
              className={inputCls}
              type="number"
              min={0}
              value={config.pricing.securityDeposit}
              onChange={(e) =>
                update('pricing', {
                  ...config.pricing,
                  securityDeposit: Number(e.target.value),
                })
              }
            />
          </div>
          <div>
            <label className={labelCls}>Currency (ISO 4217)</label>
            <input
              className={inputCls}
              maxLength={3}
              value={config.pricing.currency}
              onChange={(e) =>
                update('pricing', { ...config.pricing, currency: e.target.value.toUpperCase() })
              }
            />
          </div>
        </div>
      </section>

      {/* Payments */}
      <section className={sectionCls}>
        <h3 className={headingCls}>
          <CreditCard className="w-4 h-4" /> Payments
        </h3>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Choose <b>RAZORPAY</b> with your test/live keys for real online payments, or <b>MOCK</b>{' '}
          for the demo (no Razorpay account required). The key secret is write-only — leave the
          field blank to keep the current value.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Provider</label>
            <select
              className={inputCls}
              value={config.payments?.provider ?? 'NONE'}
              onChange={(e) =>
                update('payments', {
                  ...(config.payments ?? { provider: 'NONE', enabled: false, keyId: '', keySecret: '' }),
                  provider: e.target.value as 'NONE' | 'RAZORPAY' | 'MOCK',
                })
              }
            >
              <option value="NONE">None (disabled)</option>
              <option value="RAZORPAY">Razorpay</option>
              <option value="MOCK">Mock (test/demo)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Enabled</label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--border))]">
              <input
                type="checkbox"
                checked={config.payments?.enabled ?? false}
                onChange={(e) =>
                  update('payments', {
                    ...(config.payments ?? { provider: 'NONE', enabled: false, keyId: '', keySecret: '' }),
                    enabled: e.target.checked,
                  })
                }
                className="h-4 w-4 accent-indigo-600 cursor-pointer"
              />
              <span className="text-sm">Online payments accepted</span>
            </label>
          </div>
          <div>
            <label className={labelCls}>Razorpay Key ID</label>
            <input
              className={inputCls}
              value={config.payments?.keyId ?? ''}
              placeholder="rzp_test_xxxxxxxxxx"
              onChange={(e) =>
                update('payments', {
                  ...(config.payments ?? { provider: 'NONE', enabled: false, keyId: '', keySecret: '' }),
                  keyId: e.target.value,
                })
              }
            />
          </div>
          <div className="md:col-span-3">
            <label className={labelCls}>Razorpay Key Secret (write-only)</label>
            <input
              className={inputCls}
              type="password"
              autoComplete="off"
              value={config.payments?.keySecret ?? ''}
              placeholder="Leave blank to keep current secret"
              onChange={(e) =>
                update('payments', {
                  ...(config.payments ?? { provider: 'NONE', enabled: false, keyId: '', keySecret: '' }),
                  keySecret: e.target.value,
                })
              }
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className={sectionCls}>
        <h3 className={headingCls}>
          <ToggleRight className="w-4 h-4" /> Features
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(Object.keys(FEATURE_LABELS) as Array<keyof FeatureFlags>).map((key) => (
            <label
              key={key}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]/30 cursor-pointer"
            >
              <span className="text-sm text-[hsl(var(--foreground))]">{FEATURE_LABELS[key]}</span>
              <input
                type="checkbox"
                checked={config.features[key]}
                onChange={(e) =>
                  update('features', { ...config.features, [key]: e.target.checked })
                }
                className="h-4 w-4 accent-indigo-600 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </section>

      {/* Room types */}
      <section className={sectionCls}>
        <div className="flex items-center justify-between">
          <h3 className={headingCls}>
            <BedDouble className="w-4 h-4" /> Room types
          </h3>
          <button
            onClick={() => update('roomTypes', [...config.roomTypes, emptyRoomType()])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--muted))]/40"
          >
            <Plus className="w-3.5 h-3.5" /> Add type
          </button>
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          Key convention: <code>{'{TYPE}_{AC|NON_AC}'}</code> (e.g. <code>DELUXE_AC</code>). Rooms
          can only be created if their roomType+acType matches an active key here.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[hsl(var(--muted-foreground))]">
              <tr className="text-left border-b border-[hsl(var(--border))]">
                <th className="py-2 pr-3">Key</th>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">AC type</th>
                <th className="py-2 pr-3">Fee/sem</th>
                <th className="py-2 pr-3">Capacity</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {config.roomTypes.map((rt, i) => (
                <tr key={i} className="border-b border-[hsl(var(--border))]/50">
                  <td className="py-2 pr-3">
                    <input
                      className={inputCls}
                      value={rt.key}
                      onChange={(e) => {
                        const next = [...config.roomTypes];
                        next[i] = { ...rt, key: e.target.value.toUpperCase() };
                        update('roomTypes', next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className={inputCls}
                      value={rt.label}
                      onChange={(e) => {
                        const next = [...config.roomTypes];
                        next[i] = { ...rt, label: e.target.value };
                        update('roomTypes', next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      className={inputCls}
                      value={rt.acType}
                      onChange={(e) => {
                        const next = [...config.roomTypes];
                        next[i] = { ...rt, acType: e.target.value as 'AC' | 'NON_AC' };
                        update('roomTypes', next);
                      }}
                    >
                      <option value="AC">AC</option>
                      <option value="NON_AC">NON_AC</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className={inputCls}
                      type="number"
                      min={0}
                      value={rt.feePerSemester}
                      onChange={(e) => {
                        const next = [...config.roomTypes];
                        next[i] = { ...rt, feePerSemester: Number(e.target.value) };
                        update('roomTypes', next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className={inputCls}
                      type="number"
                      min={1}
                      max={10}
                      value={rt.capacity}
                      onChange={(e) => {
                        const next = [...config.roomTypes];
                        next[i] = { ...rt, capacity: Number(e.target.value) };
                        update('roomTypes', next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={rt.isActive}
                      onChange={(e) => {
                        const next = [...config.roomTypes];
                        next[i] = { ...rt, isActive: e.target.checked };
                        update('roomTypes', next);
                      }}
                      className="h-4 w-4 accent-indigo-600 cursor-pointer"
                    />
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => {
                        const next = config.roomTypes.filter((_, j) => j !== i);
                        update('roomTypes', next);
                      }}
                      className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="Remove room type"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {config.roomTypes.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No room types — click "Add type" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Blocks */}
      <section className={sectionCls}>
        <div className="flex items-center justify-between">
          <h3 className={headingCls}>
            <Layers className="w-4 h-4" /> Blocks
          </h3>
          <button
            onClick={() => update('blocks', [...config.blocks, emptyBlock()])}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--muted))]/40"
          >
            <Plus className="w-3.5 h-3.5" /> Add block
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-[hsl(var(--muted-foreground))]">
              <tr className="text-left border-b border-[hsl(var(--border))]">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Label</th>
                <th className="py-2 pr-3">Gender</th>
                <th className="py-2 pr-3">Floors</th>
                <th className="py-2 pr-3">Active</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {config.blocks.map((b, i) => (
                <tr key={i} className="border-b border-[hsl(var(--border))]/50">
                  <td className="py-2 pr-3">
                    <input
                      className={inputCls}
                      value={b.name}
                      onChange={(e) => {
                        const next = [...config.blocks];
                        next[i] = { ...b, name: e.target.value };
                        update('blocks', next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className={inputCls}
                      value={b.label ?? ''}
                      onChange={(e) => {
                        const next = [...config.blocks];
                        next[i] = { ...b, label: e.target.value };
                        update('blocks', next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      className={inputCls}
                      value={b.gender}
                      onChange={(e) => {
                        const next = [...config.blocks];
                        next[i] = { ...b, gender: e.target.value as 'BOYS' | 'GIRLS' };
                        update('blocks', next);
                      }}
                    >
                      <option value="BOYS">BOYS</option>
                      <option value="GIRLS">GIRLS</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      className={inputCls}
                      type="number"
                      min={1}
                      max={20}
                      value={b.floors}
                      onChange={(e) => {
                        const next = [...config.blocks];
                        next[i] = { ...b, floors: Number(e.target.value) };
                        update('blocks', next);
                      }}
                    />
                  </td>
                  <td className="py-2 pr-3 text-center">
                    <input
                      type="checkbox"
                      checked={b.isActive}
                      onChange={(e) => {
                        const next = [...config.blocks];
                        next[i] = { ...b, isActive: e.target.checked };
                        update('blocks', next);
                      }}
                      className="h-4 w-4 accent-indigo-600 cursor-pointer"
                    />
                  </td>
                  <td className="py-2">
                    <button
                      onClick={() => update('blocks', config.blocks.filter((_, j) => j !== i))}
                      className="p-1.5 rounded text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label="Remove block"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {config.blocks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No blocks — click "Add block" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
