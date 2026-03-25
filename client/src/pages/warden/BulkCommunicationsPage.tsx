import { useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import { Send, Users, Building2, Layers, Megaphone, CheckCircle2 } from 'lucide-react';

type TargetScope = 'ALL' | 'BLOCK' | 'FLOOR' | 'YEAR';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

const SCOPE_OPTIONS: { value: TargetScope; label: string; icon: typeof Users; desc: string }[] = [
  { value: 'ALL', label: 'All Students', icon: Users, desc: 'Broadcast to everyone' },
  { value: 'BLOCK', label: 'By Block', icon: Building2, desc: 'Target specific block' },
  { value: 'FLOOR', label: 'By Floor', icon: Layers, desc: 'Target specific floor' },
  { value: 'YEAR', label: 'By Year', icon: Megaphone, desc: 'Target academic year' },
];

export default function BulkCommunicationsPage() {
  const [scope, setScope] = useState<TargetScope>('ALL');
  const [targetValue, setTargetValue] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'NORMAL' | 'URGENT'>('NORMAL');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) return;
    setSending(true);
    try {
      await apiFetch('/notices', {
        method: 'POST',
        body: JSON.stringify({
          title,
          content,
          target: scope === 'YEAR' ? 'ALL' : scope,
          targetBlock: scope === 'BLOCK' ? targetValue : undefined,
          targetFloor: scope === 'FLOOR' ? targetValue : undefined,
          priority,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      showSuccess('Announcement sent successfully!');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      setTitle('');
      setContent('');
      setTargetValue('');
    } catch (err) {
      showError(err, 'Failed to send announcement');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="Bulk Communications" description="Send targeted announcements to students" />
      </Reveal>

      {/* Scope Selection */}
      <Reveal delay={0.05}>
        <div className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Target Audience</h3>
          <StaggerContainer stagger={0.06} className="grid grid-cols-2 gap-3">
            {SCOPE_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const selected = scope === opt.value;
              return (
                <StaggerItem key={opt.value}>
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  onClick={() => { setScope(opt.value); setTargetValue(''); }}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                    selected
                      ? 'bg-[hsl(var(--accent))]/8 border-[hsl(var(--accent))]/30 shadow-sm'
                      : 'bg-[hsl(var(--muted))]/30 border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${selected ? 'bg-[hsl(var(--accent))]/15' : 'bg-[hsl(var(--muted))]'} flex items-center justify-center`}>
                    <Icon size={14} className={selected ? 'text-[hsl(var(--accent))]' : 'text-[hsl(var(--muted-foreground))]'} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{opt.label}</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{opt.desc}</p>
                  </div>
                </motion.button>
                </StaggerItem>
              );
            })}
          </StaggerContainer>

          <AnimatePresence>
            {(scope === 'BLOCK' || scope === 'FLOOR' || scope === 'YEAR') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <input
                  value={targetValue}
                  onChange={e => setTargetValue(e.target.value)}
                  placeholder={scope === 'BLOCK' ? 'Block name (e.g. A)' : scope === 'FLOOR' ? 'Floor number (e.g. 2)' : 'Year (e.g. FIRST)'}
                  className="mt-3 w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30 focus:border-[hsl(var(--accent))]/50 transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>

      {/* Message Compose */}
      <Reveal delay={0.1}>
        <div className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Compose Message</h3>

          {/* Priority Toggle */}
          <div className="flex gap-2">
            {(['NORMAL', 'URGENT'] as const).map(p => (
              <motion.button
                key={p}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                transition={spring}
                onClick={() => setPriority(p)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  priority === p
                    ? p === 'URGENT'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border border-[hsl(var(--accent))]/30'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-transparent'
                }`}
              >
                {p}
              </motion.button>
            ))}
          </div>

          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Announcement title"
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30 focus:border-[hsl(var(--accent))]/50 transition-all"
          />

          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Message content..."
            rows={5}
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30 focus:border-[hsl(var(--accent))]/50 transition-all resize-none"
          />

          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            onClick={() => void handleSend()}
            disabled={sending || !title.trim() || !content.trim()}
            className="w-full py-3 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <AnimatePresence mode="wait">
              {sending ? (
                <motion.div key="sending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                  Sending...
                </motion.div>
              ) : sent ? (
                <motion.div key="sent" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <CheckCircle2 size={14} />
                  Sent!
                </motion.div>
              ) : (
                <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                  <Send size={14} />
                  Send Announcement
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </Reveal>
    </div>
  );
}
