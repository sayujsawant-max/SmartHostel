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
import { CreditCard, IndianRupee, CheckCircle2, Clock, AlertTriangle, Zap, Shield, ArrowRight } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

interface PayableFee {
  _id: string;
  feeType: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: 'UNPAID' | 'OVERDUE';
  semester: string;
  academicYear: string;
}

interface PaymentHistory {
  _id: string;
  feeType: string;
  amount: number;
  currency: string;
  paidAt: string;
  paymentId: string;
  method: string;
}

const FEE_LABELS: Record<string, string> = {
  HOSTEL_FEE: 'Hostel Fee',
  MESS_FEE: 'Mess Fee',
  MAINTENANCE_FEE: 'Maintenance Fee',
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function PaymentsPage() {
  usePageTitle('Payments');
  const [payable, setPayable] = useState<PayableFee[]>([]);
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    Promise.all([
      apiFetch<PayableFee[]>('/assistant/fees?status=UNPAID,OVERDUE'),
      apiFetch<PaymentHistory[]>('/assistant/payment-history'),
    ])
      .then(([payRes, histRes]) => {
        setPayable(payRes.data);
        setHistory(histRes.data);
      })
      .catch(err => showError(err, 'Failed to load payment data'))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async (fee: PayableFee) => {
    setPayingId(fee._id);
    try {
      const res = await apiFetch<{ orderId: string; amount: number; currency: string; key: string }>('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ feeId: fee._id }),
        headers: { 'Content-Type': 'application/json' },
      });

      const options = {
        key: res.data.key,
        amount: res.data.amount,
        currency: res.data.currency,
        name: 'SmartHostel',
        description: FEE_LABELS[fee.feeType] ?? fee.feeType,
        order_id: res.data.orderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            await apiFetch('/payments/verify', {
              method: 'POST',
              body: JSON.stringify(response),
              headers: { 'Content-Type': 'application/json' },
            });
            showSuccess('Payment successful!');
            setPayable(prev => prev.filter(f => f._id !== fee._id));
          } catch (err) {
            showError(err, 'Payment verification failed');
          }
        },
        theme: { color: 'hsl(173, 78%, 24%)' },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      showError(err, 'Failed to initiate payment');
    } finally {
      setPayingId(null);
    }
  };

  if (loading) return <PageSkeleton />;

  const totalDue = payable.reduce((s, f) => s + f.amount, 0);
  const overdueCount = payable.filter(f => f.status === 'OVERDUE').length;

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="Online Payments" description="Pay your hostel fees securely online" />
      </Reveal>

      {/* Summary */}
      <StaggerContainer className="grid grid-cols-3 gap-3" stagger={0.08}>
        <StaggerItem>
          <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={spring} className="relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/20 to-transparent" />
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center"><IndianRupee size={14} className="text-amber-600 dark:text-amber-400" /></div>
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Total Due</span>
            </div>
            <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums"><AnimatedCounter to={totalDue} prefix="₹" /></p>
          </motion.div>
        </StaggerItem>
        <StaggerItem>
          <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={spring} className="relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/20 to-transparent" />
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center"><CreditCard size={14} className="text-blue-600 dark:text-blue-400" /></div>
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Pending</span>
            </div>
            <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums"><AnimatedCounter to={payable.length} /></p>
          </motion.div>
        </StaggerItem>
        <StaggerItem>
          <motion.div whileHover={{ y: -3, scale: 1.02 }} transition={spring} className="relative overflow-hidden p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/20 to-transparent" />
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center"><AlertTriangle size={14} className="text-rose-600 dark:text-rose-400" /></div>
              <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Overdue</span>
            </div>
            <p className="text-xl font-bold text-[hsl(var(--foreground))] tabular-nums"><AnimatedCounter to={overdueCount} /></p>
          </motion.div>
        </StaggerItem>
      </StaggerContainer>

      {/* Security Badge */}
      <Reveal delay={0.1}>
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
          <Shield size={14} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Payments secured by Razorpay with 256-bit SSL encryption</span>
        </div>
      </Reveal>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="flex gap-2">
        {(['pending', 'history'] as const).map(t => (
          <motion.button key={t} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} transition={spring} onClick={() => setTab(t)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === t ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] shadow-sm' : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'}`}
          >
            {t === 'pending' ? `Pending (${payable.length})` : `History (${history.length})`}
          </motion.button>
        ))}
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {tab === 'pending' ? (
          <motion.div key="pending" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {payable.length === 0 ? (
              <EmptyState variant="compact" title="All clear!" description="You have no pending fee payments." />
            ) : (
              <div className="space-y-2.5">
                {payable.map((fee, i) => (
                  <motion.div key={fee._id} initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ delay: i * 0.05 }}>
                    <motion.div whileHover={{ y: -2, scale: 1.005 }} transition={spring} className="card-glow accent-line p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/25 hover:shadow-sm transition-all">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-[hsl(var(--foreground))]">{FEE_LABELS[fee.feeType] ?? fee.feeType}</p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{fee.semester} · {fee.academicYear}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[hsl(var(--foreground))] tabular-nums">₹{fee.amount.toLocaleString('en-IN')}</p>
                          <StatusBadge variant={fee.status === 'OVERDUE' ? 'error' : 'warning'}>{fee.status}</StatusBadge>
                        </div>
                      </div>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">Due: {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <motion.button
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        transition={spring}
                        onClick={() => void handlePay(fee)}
                        disabled={payingId !== null}
                        className="w-full py-2.5 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-xs font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                      >
                        {payingId === fee._id ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full" />
                        ) : (
                          <>
                            <Zap size={13} />
                            Pay Now
                            <ArrowRight size={12} />
                          </>
                        )}
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            {history.length === 0 ? (
              <EmptyState variant="compact" title="No payment history" description="Your payment history will appear here." />
            ) : (
              <div className="space-y-2">
                {history.map((pay, i) => (
                  <motion.div key={pay._id} initial={{ opacity: 0, x: -10, filter: 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} transition={{ delay: i * 0.04 }}>
                    <div className="card-glow accent-line flex items-center gap-3 p-3.5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[hsl(var(--foreground))]">{FEE_LABELS[pay.feeType] ?? pay.feeType}</p>
                        <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{new Date(pay.paidAt).toLocaleDateString('en-IN')} · {pay.method} · {pay.paymentId?.slice(-8)}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">₹{pay.amount.toLocaleString('en-IN')}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
