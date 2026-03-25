import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { ClipboardCheck, Plus, Calendar, MapPin, Star, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

interface Inspection {
  _id: string;
  roomNumber: string;
  block: string;
  floor: string;
  inspectedBy: { name: string };
  date: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'FAILED';
  score: number;
  remarks: string;
  issues: string[];
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
  COMPLETED: 'success',
  SCHEDULED: 'warning',
  FAILED: 'error',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function InspectionsPage() {
  usePageTitle('Inspections');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ roomNumber: '', block: '', score: 80, remarks: '', issues: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Inspection[]>('/admin/inspections')
      .then(res => setInspections(Array.isArray(res.data) ? res.data : []))
      .catch(err => showError(err, 'Failed to load inspections'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await apiFetch('/admin/inspections', {
        method: 'POST',
        body: JSON.stringify({ ...form, issues: form.issues.split(',').map(s => s.trim()).filter(Boolean) }),
        headers: { 'Content-Type': 'application/json' },
      });
      showSuccess('Inspection recorded!');
      setShowForm(false);
      setForm({ roomNumber: '', block: '', score: 80, remarks: '', issues: '' });
      const res = await apiFetch<Inspection[]>('/admin/inspections');
      setInspections(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showError(err, 'Failed to save inspection');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageSkeleton />;

  const completed = inspections.filter(i => i.status === 'COMPLETED').length;
  const avgScore = inspections.length > 0 ? Math.round(inspections.reduce((s, i) => s + i.score, 0) / inspections.length) : 0;
  const failed = inspections.filter(i => i.status === 'FAILED').length;

  const summaryCards = [
    { label: 'Total', value: inspections.length, icon: ClipboardCheck, iconClass: 'text-blue-600 dark:text-blue-400', bgClass: 'bg-blue-100 dark:bg-blue-950/40' },
    { label: 'Completed', value: completed, icon: CheckCircle2, iconClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-950/40' },
    { label: 'Avg Score', value: avgScore, icon: Star, iconClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-950/40' },
    { label: 'Failed', value: failed, icon: AlertTriangle, iconClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-100 dark:bg-rose-950/40' },
  ];

  return (
    <div className="space-y-5">
      <Reveal>
        <div className="flex items-center justify-between">
          <PageHeader title="Room Inspections" description="Track and manage room inspection records" />
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            onClick={() => setShowForm(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-xs font-semibold shadow-sm"
          >
            <Plus size={14} />
            New Inspection
          </motion.button>
        </div>
      </Reveal>

      <StaggerContainer className="grid grid-cols-4 gap-3" stagger={0.06}>
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.label}>
              <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={spring} className="relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/20 to-transparent" />
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${card.bgClass} flex items-center justify-center`}><Icon size={14} className={card.iconClass} /></div>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{card.label}</span>
                </div>
                <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums"><AnimatedCounter to={card.value} /></p>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* New Inspection Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--accent))]/30 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Record Inspection</h3>
              <div className="grid grid-cols-2 gap-3">
                <input value={form.block} onChange={e => setForm(f => ({ ...f, block: e.target.value }))} placeholder="Block" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30" />
                <input value={form.roomNumber} onChange={e => setForm(f => ({ ...f, roomNumber: e.target.value }))} placeholder="Room Number" className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30" />
              </div>
              <div>
                <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1 block">Score (0-100)</label>
                <input type="number" min={0} max={100} value={form.score} onChange={e => setForm(f => ({ ...f, score: +e.target.value }))} className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30" />
              </div>
              <textarea value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} placeholder="Remarks" rows={2} className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30 resize-none" />
              <input value={form.issues} onChange={e => setForm(f => ({ ...f, issues: e.target.value }))} placeholder="Issues (comma-separated)" className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30" />
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={spring} onClick={() => void handleSubmit()} disabled={submitting} className="w-full py-2.5 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-semibold disabled:opacity-50">
                {submitting ? 'Saving...' : 'Save Inspection'}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inspection List */}
      {inspections.length === 0 ? (
        <EmptyState variant="compact" title="No inspections yet" description="Start by recording a room inspection." />
      ) : (
        <div className="space-y-2.5">
          {inspections.map((insp, i) => (
            <motion.div
              key={insp._id}
              initial={{ opacity: 0, y: 10, scale: 0.98, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              transition={{ delay: i * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={{ y: -2, scale: 1.005 }}
                transition={spring}
                className="card-glow accent-line p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/25 hover:shadow-sm transition-all duration-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      insp.score >= 80 ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : insp.score >= 60 ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                        : 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                    }`}>
                      {insp.score}
                    </div>
                    <div>
                      <p className="font-semibold text-[hsl(var(--foreground))]">
                        Block {insp.block} · Room {insp.roomNumber}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-1.5">
                        <Calendar size={11} />
                        {new Date(insp.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <span className="mx-1">·</span>
                        {insp.inspectedBy?.name ?? 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <StatusBadge variant={STATUS_VARIANT[insp.status] ?? 'neutral'}>{insp.status}</StatusBadge>
                </div>
                {insp.remarks && <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2 ml-13">{insp.remarks}</p>}
                {insp.issues.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 ml-13">
                    {insp.issues.map(issue => (
                      <span key={issue} className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-[10px] font-medium text-rose-600 dark:text-rose-400">{issue}</span>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
