import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { MotionCard } from '@/components/motion/MotionCard';
import PageHeader from '@components/ui/PageHeader';

interface Leave {
  _id: string;
  status: string;
}

const actions = [
  {
    to: '/student/actions/show-qr',
    title: 'Show QR',
    desc: 'Display your active gate pass',
    descInactive: 'No active pass',
    needsPass: true,
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625v2.25m0 3v.75m3-3h.75m-6 0h.75m2.25-2.25h3v3h-3v-3z" />
      </svg>
    ),
  },
  {
    to: '/student/actions/report-issue',
    title: 'Report Issue',
    desc: 'File a maintenance complaint',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
      </svg>
    ),
  },
  {
    to: '/student/actions/request-leave',
    title: 'Request Leave',
    desc: 'Apply for day outing or overnight leave',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    to: '/student/visitors',
    title: 'Register Visitor',
    desc: 'Pre-register an expected visitor',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    to: '/student/room-change',
    title: 'Room Change',
    desc: 'Request a room transfer',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    to: '/student/lost-found',
    title: 'Lost & Found',
    desc: 'Report or find lost items',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    to: '/student/room-request',
    title: 'Request Room',
    desc: 'Browse and request a hostel room',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
];

export default function ActionsPage() {
  const [hasActivePass, setHasActivePass] = useState(false);

  useEffect(() => {
    apiFetch<{ leaves: Leave[] }>('/leaves')
      .then((res) => {
        const active = res.data.leaves.some((l) => l.status === 'APPROVED' || l.status === 'SCANNED_OUT');
        setHasActivePass(active);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <Reveal>
        <PageHeader title="Actions" description="Quick actions for your hostel needs." />
      </Reveal>

      <StaggerContainer className="grid gap-3" stagger={0.05}>
        {actions.map((action) => {
          const isQR = action.needsPass;
          const disabled = isQR && !hasActivePass;

          return (
            <StaggerItem key={action.to}>
              <MotionCard lift={disabled ? 0 : 3}>
                <Link
                  to={action.to}
                  aria-disabled={disabled}
                  tabIndex={disabled ? -1 : undefined}
                  className={`flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                    isQR
                      ? hasActivePass
                        ? 'bg-green-50 border-green-200 hover:shadow-sm'
                        : 'bg-[hsl(var(--muted))] border-[hsl(var(--border))] opacity-60 pointer-events-none'
                      : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--accent))]/40 hover:shadow-sm'
                  }`}
                >
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                    isQR && hasActivePass
                      ? 'bg-green-100 text-green-700'
                      : 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]'
                  }`}>
                    {action.icon}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[hsl(var(--foreground))]">{action.title}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] mt-0.5">
                      {isQR ? (hasActivePass ? action.desc : action.descInactive) : action.desc}
                    </p>
                  </div>
                </Link>
              </MotionCard>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
