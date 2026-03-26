import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Lightbulb,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  ArrowRight,
  Sparkles,
  BrainCircuit,
} from 'lucide-react';

interface InsightData {
  complaints: { status: string; category: string; createdAt: string }[];
  leaves: { status: string; type: string; startDate: string; endDate: string }[];
  fees: { status: string; amount: number; dueDate: string; feeType: string }[];
}

interface Insight {
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  text: string;
  action?: { label: string; to: string };
  priority: number;
}

export default function SmartInsights({ complaints, leaves, fees }: InsightData) {
  const insights = useMemo(() => {
    const items: Insight[] = [];
    // eslint-disable-next-line react-hooks/purity -- Date.now() inside useMemo is stable per render
    const now = Date.now();
    const DAY = 86_400_000;

    const unpaidFees = fees.filter((f) => f.status !== 'PAID');
    const overdueFees = fees.filter((f) => f.status === 'OVERDUE');
    const soonDueFees = unpaidFees.filter((f) => {
      const daysUntil = (new Date(f.dueDate).getTime() - now) / DAY;
      return daysUntil > 0 && daysUntil <= 7;
    });

    if (overdueFees.length > 0) {
      const total = overdueFees.reduce((s, f) => s + f.amount, 0);
      items.push({
        icon: AlertCircle, iconColor: 'text-red-500', bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/10 hover:border-red-500/25',
        text: `You have ${overdueFees.length} overdue fee${overdueFees.length > 1 ? 's' : ''} totaling ₹${total.toLocaleString('en-IN')}. Pay now to avoid penalties.`,
        action: { label: 'View Fees', to: '/student/fees' }, priority: 0,
      });
    } else if (soonDueFees.length > 0) {
      const nextDue = soonDueFees.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];
      const daysLeft = Math.ceil((new Date(nextDue.dueDate).getTime() - now) / DAY);
      items.push({
        icon: CreditCard, iconColor: 'text-amber-500', bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/10 hover:border-amber-500/25',
        text: `${nextDue.feeType.replace(/_/g, ' ')} payment of ₹${nextDue.amount.toLocaleString('en-IN')} is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.`,
        action: { label: 'Pay Now', to: '/student/payments' }, priority: 1,
      });
    }

    const openComplaints = complaints.filter((c) => c.status === 'OPEN' || c.status === 'ASSIGNED');
    const inProgressComplaints = complaints.filter((c) => c.status === 'IN_PROGRESS');
    const resolvedThisMonth = complaints.filter((c) => c.status === 'RESOLVED' && (now - new Date(c.createdAt).getTime()) < 30 * DAY);

    if (inProgressComplaints.length > 0) {
      items.push({
        icon: TrendingUp, iconColor: 'text-blue-500', bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/10 hover:border-blue-500/25',
        text: `${inProgressComplaints.length} complaint${inProgressComplaints.length > 1 ? 's are' : ' is'} being worked on right now.`,
        priority: 3,
      });
    }

    if (resolvedThisMonth.length > 0) {
      items.push({
        icon: CheckCircle2, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/10 hover:border-emerald-500/25',
        text: `${resolvedThisMonth.length} complaint${resolvedThisMonth.length > 1 ? 's' : ''} resolved this month. Your hostel is getting better!`,
        priority: 5,
      });
    }

    if (openComplaints.length > 2) {
      items.push({
        icon: AlertCircle, iconColor: 'text-amber-500', bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/10 hover:border-amber-500/25',
        text: `You have ${openComplaints.length} open complaints. Consider following up with the warden.`,
        action: { label: 'View Status', to: '/student/status' }, priority: 2,
      });
    }

    const pendingLeaves = leaves.filter((l) => l.status === 'PENDING');
    const approvedLeaves = leaves.filter((l) => l.status === 'APPROVED');
    const usedLeaves = leaves.filter((l) => ['COMPLETED', 'SCANNED_IN', 'APPROVED', 'SCANNED_OUT'].includes(l.status));

    if (pendingLeaves.length > 0) {
      items.push({
        icon: Calendar, iconColor: 'text-violet-500', bgColor: 'bg-violet-500/10',
        borderColor: 'border-violet-500/10 hover:border-violet-500/25',
        text: `${pendingLeaves.length} leave request${pendingLeaves.length > 1 ? 's' : ''} pending approval. You'll be notified when the warden responds.`,
        priority: 2,
      });
    }

    if (approvedLeaves.length > 0 && !approvedLeaves.some((l) => l.status === 'SCANNED_OUT')) {
      items.push({
        icon: CheckCircle2, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/10 hover:border-emerald-500/25',
        text: 'You have an approved leave pass! Don\'t forget to scan your QR at the gate.',
        action: { label: 'Show QR', to: '/student/actions/show-qr' }, priority: 1,
      });
    }

    if (openComplaints.length === 0 && overdueFees.length === 0 && pendingLeaves.length === 0) {
      items.push({
        icon: Sparkles, iconColor: 'text-indigo-500', bgColor: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/10 hover:border-indigo-500/25',
        text: 'Everything looks great! No pending issues, no overdue fees. Enjoy your day!',
        priority: 10,
      });
    }

    if (usedLeaves.length >= 3) {
      items.push({
        icon: TrendingUp, iconColor: 'text-teal-500', bgColor: 'bg-teal-500/10',
        borderColor: 'border-teal-500/10 hover:border-teal-500/25',
        text: `You've used ${usedLeaves.length} leave${usedLeaves.length !== 1 ? 's' : ''} so far. Keep track of your quota.`,
        action: { label: 'Leave Tracker', to: '/student/leave-tracker' }, priority: 7,
      });
    }

    return items.sort((a, b) => a.priority - b.priority).slice(0, 3);
  }, [complaints, leaves, fees]);

  if (insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 card-glow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/15 to-violet-500/15 flex items-center justify-center">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">Smart Insights</h3>
            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Personalized for you</p>
          </div>
        </div>
        <Lightbulb className="w-4 h-4 text-amber-400" />
      </div>

      {/* Insights — plain divs with CSS hover transitions */}
      <div className="space-y-2.5">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <div
              key={i}
              className={`flex items-start gap-3 p-3.5 rounded-xl border bg-[hsl(var(--card))] ${insight.borderColor} transition-all duration-200 cursor-default hover:translate-x-1`}
            >
              <div className={`w-9 h-9 rounded-xl ${insight.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4.5 h-4.5 ${insight.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[hsl(var(--foreground))] leading-relaxed">{insight.text}</p>
                {insight.action && (
                  <Link
                    to={insight.action.to}
                    className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold text-[hsl(var(--accent))] hover:underline group/link"
                  >
                    {insight.action.label}
                    <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
