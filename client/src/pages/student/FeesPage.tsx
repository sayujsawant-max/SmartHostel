import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { useAuth } from '@hooks/useAuth';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import { CreditCard, Download, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';

interface FeeItem {
  _id: string;
  feeType: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  semester: string;
  academicYear: string;
  createdAt: string;
}

const FEE_VARIANT: Record<string, 'success' | 'warning' | 'error'> = {
  PAID: 'success',
  UNPAID: 'warning',
  OVERDUE: 'error',
};

const FEE_LABELS: Record<string, string> = {
  HOSTEL_FEE: 'Hostel Fee',
  MESS_FEE: 'Mess Fee',
  MAINTENANCE_FEE: 'Maintenance Fee',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function FeesPage() {
  const { user } = useAuth();
  const [fees, setFees] = useState<FeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    apiFetch<FeeItem[]>('/assistant/fees')
      .then(res => setFees(res.data))
      .catch(err => showError(err, 'Failed to load fees'))
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = fees.filter(f => f.status === 'PAID').reduce((s, f) => s + f.amount, 0);
  const totalPending = fees.filter(f => f.status !== 'PAID').reduce((s, f) => s + f.amount, 0);
  const overdueCount = fees.filter(f => f.status === 'OVERDUE').length;

  const filtered = filterStatus ? fees.filter(f => f.status === filterStatus) : fees;

  // Group by semester
  const bySemester = new Map<string, FeeItem[]>();
  for (const fee of filtered) {
    const key = `${fee.semester} (${fee.academicYear})`;
    const arr = bySemester.get(key) || [];
    arr.push(fee);
    bySemester.set(key, arr);
  }

  const handleDownloadReceipt = async (fee: FeeItem) => {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('SmartHostel', 20, 25);
    doc.setFontSize(12);
    doc.text('Fee Receipt', 20, 35);

    doc.setFontSize(10);
    doc.text(`Student: ${user?.name ?? 'N/A'}`, 20, 50);
    doc.text(`Room: ${user?.roomNumber ?? 'N/A'} | Block: ${user?.block ?? 'N/A'}`, 20, 57);

    doc.line(20, 63, 190, 63);

    doc.setFontSize(11);
    doc.text('Fee Details', 20, 72);

    doc.setFontSize(10);
    const details = [
      ['Fee Type', FEE_LABELS[fee.feeType] ?? fee.feeType],
      ['Amount', `${fee.currency} ${fee.amount.toLocaleString('en-IN')}`],
      ['Status', fee.status],
      ['Semester', fee.semester],
      ['Academic Year', fee.academicYear],
      ['Due Date', new Date(fee.dueDate).toLocaleDateString('en-IN')],
    ];

    let y = 80;
    for (const [label, value] of details) {
      doc.text(`${label}:`, 20, y);
      doc.text(value, 80, y);
      y += 8;
    }

    doc.line(20, y + 4, 190, y + 4);
    doc.setFontSize(8);
    doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 20, y + 12);
    doc.text('This is a system-generated receipt.', 20, y + 18);

    doc.save(`receipt-${fee.feeType}-${fee.semester}.pdf`);
  };

  if (loading) return <PageSkeleton />;

  const summaryCards = [
    { label: 'Total Paid', value: totalPaid, prefix: '₹', icon: CheckCircle2, iconClass: 'text-emerald-600 dark:text-emerald-400', bgClass: 'bg-emerald-100 dark:bg-emerald-950/40' },
    { label: 'Pending', value: totalPending, prefix: '₹', icon: TrendingUp, iconClass: 'text-amber-600 dark:text-amber-400', bgClass: 'bg-amber-100 dark:bg-amber-950/40' },
    { label: 'Overdue', value: overdueCount, icon: AlertTriangle, iconClass: 'text-rose-600 dark:text-rose-400', bgClass: 'bg-rose-100 dark:bg-rose-950/40' },
  ];

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="Fees & Payments" description="View your fee status and download receipts" />
      </Reveal>

      {/* Summary Cards */}
      <StaggerContainer className="grid grid-cols-3 gap-3" stagger={0.08}>
        {summaryCards.map(card => {
          const Icon = card.icon;
          return (
            <StaggerItem key={card.label}>
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={spring}
                className="relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/20 to-transparent" />
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg ${card.bgClass} flex items-center justify-center`}>
                    <Icon size={14} className={card.iconClass} />
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{card.label}</span>
                </div>
                <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums">
                  <AnimatedCounter to={card.value} prefix={card.prefix} />
                </p>
              </motion.div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>

      {/* Filter Pills */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.4 }}
        className="flex gap-2"
      >
        {['', 'PAID', 'UNPAID', 'OVERDUE'].map(status => (
          <motion.button
            key={status}
            onClick={() => setFilterStatus(status)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
              filterStatus === status
                ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]/70'
            }`}
          >
            {status || 'All'}
            {filterStatus === status && (
              <motion.div
                layoutId="fee-filter-indicator"
                className="absolute inset-0 rounded-xl bg-[hsl(var(--accent))] -z-10"
                transition={spring}
              />
            )}
          </motion.button>
        ))}
      </motion.div>

      {/* Fee List */}
      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <EmptyState variant="compact" title="No fees found" description="No fees match the current filter." />
          </motion.div>
        ) : (
          <motion.div
            key={filterStatus}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {Array.from(bySemester.entries()).map(([semester, items], si) => (
              <Reveal key={semester} delay={si * 0.05}>
                <div className="space-y-2.5 mb-5">
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-[hsl(var(--accent))]/10 flex items-center justify-center">
                      <CreditCard size={12} className="text-[hsl(var(--accent))]" />
                    </div>
                    {semester}
                  </h3>
                  <div className="space-y-2.5">
                    {items.map((fee, i) => (
                      <motion.div
                        key={fee._id}
                        initial={{ opacity: 0, y: 10, scale: 0.98, filter: 'blur(6px)' }}
                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        transition={{ delay: i * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      >
                        <motion.div
                          whileHover={{ y: -2, scale: 1.005 }}
                          transition={spring}
                          className="card-glow p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/25 hover:shadow-sm transition-all duration-200"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-[hsl(var(--foreground))]">
                                {FEE_LABELS[fee.feeType] ?? fee.feeType}
                              </p>
                              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                                Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-[hsl(var(--foreground))] tabular-nums">
                                {fee.currency} {fee.amount.toLocaleString('en-IN')}
                              </p>
                              <StatusBadge variant={FEE_VARIANT[fee.status] ?? 'neutral'}>
                                {fee.status}
                              </StatusBadge>
                            </div>
                          </div>

                          {fee.status === 'PAID' && (
                            <motion.button
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.2 }}
                              whileHover={{ scale: 1.03, x: 2 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => void handleDownloadReceipt(fee)}
                              className="mt-3 flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[hsl(var(--accent))]/8 text-xs font-semibold text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/14 transition-colors"
                            >
                              <Download size={13} />
                              Download Receipt
                              <ArrowRight size={11} />
                            </motion.button>
                          )}
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
