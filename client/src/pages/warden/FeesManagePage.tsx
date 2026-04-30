import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { Reveal } from '@/components/motion';
import StatusBadge from '@components/ui/StatusBadge';
import Spinner from '@components/ui/Spinner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  IndianRupee,
  Plus,
  X,
  Send,
  Users,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

const FEE_TYPES = [
  { key: 'HOSTEL_FEE', label: 'Hostel Fee' },
  { key: 'MESS_FEE', label: 'Mess Fee' },
  { key: 'MAINTENANCE_FEE', label: 'Maintenance Fee' },
] as const;

type FeeType = (typeof FEE_TYPES)[number]['key'];

interface StudentRef {
  _id: string;
  name: string;
  email: string;
  roomNumber?: string;
  block?: string;
}

interface FeeRecord {
  _id: string;
  studentId: StudentRef | string | null;
  feeType: FeeType;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  semester: string;
  academicYear: string;
  createdAt: string;
}

interface StudentSummary {
  _id: string;
  name: string;
  email: string;
  roomNumber?: string;
  block?: string;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  PAID: 'success',
  UNPAID: 'warning',
  OVERDUE: 'error',
};

export default function FeesManagePage() {
  usePageTitle('Fees');
  const [fees, setFees] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [scope, setScope] = useState<'ONE' | 'ALL'>('ONE');
  const [studentId, setStudentId] = useState('');
  const [feeType, setFeeType] = useState<FeeType>('HOSTEL_FEE');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [semester, setSemester] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'' | 'PAID' | 'UNPAID' | 'OVERDUE'>('');

  const fetchFees = async () => {
    try {
      const res = await apiFetch<{ fees: FeeRecord[] }>('/fees');
      setFees(res.data?.fees ?? []);
    } catch (err) {
      showError(err, 'Failed to load fees');
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await apiFetch<{ students: StudentSummary[] }>('/fees/students');
      setStudents(res.data?.students ?? []);
    } catch {
      // Non-fatal — warden can still issue to all
    }
  };

  useEffect(() => {
    void Promise.all([fetchFees(), fetchStudents()]).finally(() => setLoading(false));
  }, []);

  const inputCls =
    'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-shadow';

  const resetForm = () => {
    setStudentId('');
    setAmount('');
    setDueDate('');
    setSemester('');
    setAcademicYear('');
    setScope('ONE');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !dueDate || !semester || !academicYear) {
      showError(new Error('Please fill all required fields'), 'Missing fields');
      return;
    }
    if (scope === 'ONE' && !studentId) {
      showError(new Error('Pick a student or switch to "All students"'), 'Student required');
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        feeType,
        amount: Number(amount),
        dueDate,
        semester,
        academicYear,
      };
      if (scope === 'ONE') {
        await apiFetch('/fees', {
          method: 'POST',
          body: JSON.stringify({ studentId, ...body }),
          headers: { 'Content-Type': 'application/json' },
        });
        showSuccess('Fee issued');
      } else {
        const res = await apiFetch<{ issued: number }>('/fees/all', {
          method: 'POST',
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        });
        showSuccess(`Issued to ${res.data?.issued ?? 0} students`);
      }
      resetForm();
      setShowForm(false);
      await fetchFees();
    } catch (err) {
      showError(err, 'Failed to issue fee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this unpaid fee?')) return;
    try {
      await apiFetch(`/fees/${id}`, { method: 'DELETE' });
      setFees(prev => prev.filter(f => f._id !== id));
      showSuccess('Fee deleted');
    } catch (err) {
      showError(err, 'Failed to delete fee');
    }
  };

  const stats = useMemo(() => {
    const paid = fees.filter(f => f.status === 'PAID').length;
    const unpaid = fees.filter(f => f.status === 'UNPAID').length;
    const overdue = fees.filter(f => f.status === 'OVERDUE').length;
    const collected = fees.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0);
    const outstanding = fees.filter(f => f.status !== 'PAID').reduce((s, f) => s + f.amount, 0);
    return { paid, unpaid, overdue, collected, outstanding };
  }, [fees]);

  const filtered = filterStatus ? fees.filter(f => f.status === filterStatus) : fees;

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600/10 via-[hsl(var(--card))] to-amber-600/10 border border-[hsl(var(--border))] p-6"
      >
        <div className="absolute top-4 right-4 opacity-10">
          <IndianRupee className="w-24 h-24 text-emerald-500" />
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))]">Fees</h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Issue and track student fees</p>
            </div>
          </div>
          <motion.button
            onClick={() => setShowForm(!showForm)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--primary))]/20"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? 'Cancel' : 'Issue Fee'}
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Collected', value: stats.collected, prefix: '₹', icon: CheckCircle2, iconBg: 'bg-emerald-100 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Outstanding', value: stats.outstanding, prefix: '₹', icon: Clock, iconBg: 'bg-amber-100 dark:bg-amber-950/40', iconColor: 'text-amber-600 dark:text-amber-400' },
          { label: 'Unpaid', value: stats.unpaid, icon: CreditCard, iconBg: 'bg-blue-100 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, iconBg: 'bg-rose-100 dark:bg-rose-950/40', iconColor: 'text-rose-600 dark:text-rose-400' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{s.label}</p>
                  <p className="text-2xl font-bold text-[hsl(var(--foreground))] tabular-nums">
                    <AnimatedCounter to={s.value} prefix={s.prefix} />
                  </p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.iconBg} ${s.iconColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Issue form */}
      <AnimatePresence>
        {showForm && (
          <motion.form
            key="issue-form"
            onSubmit={(e) => void handleSubmit(e)}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <Send className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Issue Fee</h3>
            </div>

            {/* Scope */}
            <div className="flex gap-2">
              {(['ONE', 'ALL'] as const).map(s => (
                <motion.button
                  key={s}
                  type="button"
                  onClick={() => setScope(s)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    scope === s
                      ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                  }`}
                >
                  {s === 'ONE' ? 'Single Student' : <><Users className="w-3.5 h-3.5" />All Students</>}
                </motion.button>
              ))}
            </div>

            {scope === 'ONE' && (
              <div>
                <label className="block text-sm font-medium mb-1">Student</label>
                <select value={studentId} onChange={e => setStudentId(e.target.value)} className={inputCls} required>
                  <option value="">— Pick a student —</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name} {s.roomNumber ? `· Room ${s.roomNumber}` : ''} {s.email ? `· ${s.email}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Fee Type</label>
                <select value={feeType} onChange={e => setFeeType(e.target.value as FeeType)} className={inputCls}>
                  {FEE_TYPES.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                <input type="number" min={1} value={amount} onChange={e => setAmount(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={inputCls} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester</label>
                <input value={semester} onChange={e => setSemester(e.target.value)} placeholder="Spring 2026" className={inputCls} required />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Academic Year</label>
                <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} placeholder="2025-2026" className={inputCls} required />
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-2.5 rounded-xl text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Spinner size="h-4 w-4" />}
              {submitting ? 'Issuing…' : scope === 'ONE' ? 'Issue Fee' : 'Issue to All Students'}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'PAID', 'UNPAID', 'OVERDUE'] as const).map(s => (
          <motion.button
            key={s}
            onClick={() => setFilterStatus(s)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
              filterStatus === s ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
            }`}
          >
            {s || 'All'}
          </motion.button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState title="No fees" description={fees.length === 0 ? 'Issue your first fee using the button above.' : 'No fees match this filter.'} />
      ) : (
        <Reveal>
          <div className="space-y-2.5">
            {filtered.map((f, i) => {
              const student = typeof f.studentId === 'object' && f.studentId !== null ? f.studentId : null;
              return (
                <motion.div
                  key={f._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                  className="card-glow p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="font-semibold text-[hsl(var(--foreground))] truncate">
                        {student?.name ?? '(deleted student)'}{student?.roomNumber ? ` · Room ${student.roomNumber}` : ''}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        {FEE_TYPES.find(t => t.key === f.feeType)?.label ?? f.feeType} · {f.semester} · {f.academicYear}
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                        Due {new Date(f.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-base font-bold tabular-nums">₹{f.amount.toLocaleString('en-IN')}</p>
                        <StatusBadge variant={STATUS_VARIANT[f.status]}>{f.status}</StatusBadge>
                      </div>
                      {f.status !== 'PAID' && (
                        <motion.button
                          onClick={() => void handleDelete(f._id)}
                          whileHover={{ scale: 1.06 }}
                          whileTap={{ scale: 0.94 }}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          title="Delete unpaid fee"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Reveal>
      )}
    </div>
  );
}
