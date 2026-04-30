import { useRef, useState } from 'react';
import type { HostelConfig } from '@smarthostel/shared';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import { Sparkles, Send, CheckCircle2, AlertCircle, User, Bot } from 'lucide-react';

interface AiAction {
  tool: string;
  args: Record<string, unknown>;
  ok: boolean;
  detail: string;
}

interface AiChatResponse {
  reply: string;
  actions: AiAction[];
  config: HostelConfig;
}

interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
  actions?: AiAction[];
}

interface Props {
  onConfigChange: (config: HostelConfig) => void;
}

const SUGGESTIONS = [
  'Change AC rooms to 8500',
  'Disable laundry',
  'Set primary color to #10b981',
  'Rename hostel to Acme Hostel',
];

export default function HostelConfigAiChat({ onConfigChange }: Props) {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  async function send(message: string) {
    const trimmed = message.trim();
    if (!trimmed || busy) return;

    const userTurn: ChatTurn = { role: 'user', content: trimmed };
    const history = turns.map((t) => ({ role: t.role, content: t.content }));
    setTurns((prev) => [...prev, userTurn]);
    setInput('');
    setBusy(true);

    try {
      const res = await apiFetch<AiChatResponse>('/admin/hostel-config-ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: trimmed, history }),
      });
      const { reply, actions, config } = res.data;

      setTurns((prev) => [...prev, { role: 'assistant', content: reply, actions }]);

      if (actions.some((a) => a.ok)) {
        onConfigChange(config);
      }

      requestAnimationFrame(() => {
        transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: 'smooth' });
      });
    } catch (err) {
      showError(err, 'AI request failed');
      setTurns((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-50 via-[hsl(var(--card))] to-purple-50 dark:from-indigo-950/30 dark:via-[hsl(var(--card))] dark:to-purple-950/30 border border-[hsl(var(--border))] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: [0, 12, -8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4" />
        </motion.div>
        <div>
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">AI admin</h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">
            Type what you want to change in plain English. The site updates instantly.
          </p>
        </div>
      </div>

      {turns.length > 0 && (
        <div
          ref={transcriptRef}
          className="max-h-72 overflow-y-auto space-y-3 pr-1 scrollbar-none"
        >
          <AnimatePresence initial={false}>
            {turns.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="flex gap-2"
              >
                <div
                  className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    t.role === 'user'
                      ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'bg-purple-100 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400'
                  }`}
                >
                  {t.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap break-words">
                    {t.content}
                  </div>
                  {t.actions && t.actions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {t.actions.map((a, j) => (
                        <span
                          key={j}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ${
                            a.ok
                              ? 'bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300'
                          }`}
                          title={a.detail}
                        >
                          {a.ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                          {a.tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {turns.length === 0 && (
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => void send(s)}
              disabled={busy}
              className="px-3 py-1.5 rounded-full text-xs border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. Change AC rooms to 8500"
          disabled={busy}
          className="flex-1 px-3 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-shadow"
        />
        <motion.button
          type="submit"
          disabled={busy || !input.trim()}
          whileHover={!busy ? { scale: 1.02 } : undefined}
          whileTap={!busy ? { scale: 0.98 } : undefined}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {busy ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </motion.button>
      </form>
    </div>
  );
}
