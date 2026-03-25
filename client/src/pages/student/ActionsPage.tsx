import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { motion } from '@components/ui/motion';
import PageHeader from '@components/ui/PageHeader';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  QrCode,
  Wrench,
  CalendarDays,
  Users,
  ArrowLeftRight,
  Search,
  Home,
  ChevronRight,
} from 'lucide-react';

interface Leave {
  _id: string;
  status: string;
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

const actions = [
  {
    to: '/student/actions/show-qr',
    title: 'Show QR',
    desc: 'Display your active gate pass',
    descInactive: 'No active pass',
    needsPass: true,
    icon: QrCode,
    color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
    activeColor: 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40',
    ring: 'group-hover:ring-emerald-200 dark:group-hover:ring-emerald-800/40',
  },
  {
    to: '/student/actions/report-issue',
    title: 'Report Issue',
    desc: 'File a maintenance complaint',
    icon: Wrench,
    color: 'bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
    ring: 'group-hover:ring-rose-200 dark:group-hover:ring-rose-800/40',
  },
  {
    to: '/student/actions/request-leave',
    title: 'Request Leave',
    desc: 'Apply for day outing or overnight leave',
    icon: CalendarDays,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
    ring: 'group-hover:ring-blue-200 dark:group-hover:ring-blue-800/40',
  },
  {
    to: '/student/visitors',
    title: 'Register Visitor',
    desc: 'Pre-register an expected visitor',
    icon: Users,
    color: 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400',
    ring: 'group-hover:ring-violet-200 dark:group-hover:ring-violet-800/40',
  },
  {
    to: '/student/room-change',
    title: 'Room Change',
    desc: 'Request a room transfer',
    icon: ArrowLeftRight,
    color: 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
    ring: 'group-hover:ring-amber-200 dark:group-hover:ring-amber-800/40',
  },
  {
    to: '/student/lost-found',
    title: 'Lost & Found',
    desc: 'Report or find lost items',
    icon: Search,
    color: 'bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400',
    ring: 'group-hover:ring-teal-200 dark:group-hover:ring-teal-800/40',
  },
  {
    to: '/student/room-request',
    title: 'Request Room',
    desc: 'Browse and request a hostel room',
    icon: Home,
    color: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400',
    ring: 'group-hover:ring-indigo-200 dark:group-hover:ring-indigo-800/40',
  },
];

export default function ActionsPage() {
  usePageTitle('Actions');
  const [hasActivePass, setHasActivePass] = useState(false);

  useEffect(() => {
    apiFetch<{ leaves: Leave[] }>('/leaves')
      .then((res) => {
        const active = res.data.leaves.some((l) => l.status === 'APPROVED' || l.status === 'SCANNED_OUT');
        setHasActivePass(active);
      })
      .catch((err: unknown) => showError(err, 'Failed to load data'));
  }, []);

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <PageHeader title="Actions" description="Quick actions for your hostel needs." />
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => {
          const isQR = action.needsPass;
          const disabled = isQR && !hasActivePass;
          const Icon = action.icon;

          return (
            <motion.div
              key={action.to}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.4,
                delay: 0.08 * i,
                ease: [0.25, 0.46, 0.45, 0.94],
              }}
            >
              <motion.div
                whileHover={disabled ? {} : { y: -4, scale: 1.02 }}
                whileTap={disabled ? {} : { scale: 0.97 }}
                transition={spring}
              >
                <Link
                  to={action.to}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : undefined}
                  className={`group relative flex flex-col items-center text-center gap-3 p-5 rounded-2xl border transition-all duration-200 ${
                    isQR
                      ? hasActivePass
                        ? `${action.activeColor} hover:shadow-md ring-0 hover:ring-2 ${action.ring}`
                        : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] opacity-50 pointer-events-none'
                      : `border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:shadow-md hover:border-transparent ring-0 hover:ring-2 ${action.ring} card-glow`
                  }`}
                >
                  <motion.div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      isQR && !hasActivePass
                        ? 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
                        : action.color
                    }`}
                    whileHover={disabled ? {} : { rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                  >
                    <Icon className="w-6 h-6" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))] leading-tight">
                      {action.title}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 leading-snug">
                      {isQR ? (hasActivePass ? action.desc : action.descInactive) : action.desc}
                    </p>
                  </div>
                  {!disabled && (
                    <ChevronRight className="absolute top-3 right-3 w-4 h-4 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-60 transition-opacity" />
                  )}
                </Link>
              </motion.div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
