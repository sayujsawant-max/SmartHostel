import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Clock, QrCode, Shield, ArrowRight } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 300, damping: 25 };

interface PassCountdownProps {
  leave: {
    _id: string;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
  };
}

function getTimeLeft(endDate: string) {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    hours: Math.floor(diff / 3_600_000),
    minutes: Math.floor((diff % 3_600_000) / 60_000),
    seconds: Math.floor((diff % 60_000) / 1_000),
    total: diff,
  };
}

function getProgress(startDate: string, endDate: string) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const total = end - start;
  if (total <= 0) return 100;
  return Math.min(100, Math.max(0, ((Date.now() - start) / total) * 100));
}

export default function PassCountdown({ leave }: PassCountdownProps) {
  const [time, setTime] = useState(() => getTimeLeft(leave.endDate));
  const [progress, setProgress] = useState(() => getProgress(leave.startDate, leave.endDate));

  useEffect(() => {
    const id = setInterval(() => {
      setTime(getTimeLeft(leave.endDate));
      setProgress(getProgress(leave.startDate, leave.endDate));
    }, 1000);
    return () => clearInterval(id);
  }, [leave.endDate, leave.startDate]);

  if (time.total <= 0) return null;

  const isUrgent = time.hours < 2;
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference * (1 - progress / 100);
  const hh = String(time.hours).padStart(2, '0');
  const mm = String(time.minutes).padStart(2, '0');
  const ss = String(time.seconds).padStart(2, '0');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring }}
      className="relative overflow-hidden rounded-2xl card-glow"
    >
      <div className={`relative p-5 border ${
        isUrgent
          ? 'bg-red-500/[0.06] dark:bg-red-500/[0.08] border-red-500/20'
          : 'bg-emerald-500/[0.06] dark:bg-emerald-500/[0.08] border-emerald-500/20'
      }`}>

        {/* CSS shimmer instead of motion loop */}
        <div className="absolute inset-0 pointer-events-none shimmer opacity-10" />

        <div className="relative flex items-center gap-5">
          {/* ── Progress Ring ────────────────── */}
          <div className="relative w-28 h-28 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" strokeWidth="5"
                className={isUrgent ? 'stroke-red-500/10' : 'stroke-emerald-500/10'} />
              <circle
                cx="60" cy="60" r="52" fill="none" strokeWidth="5"
                strokeLinecap="round"
                className={isUrgent ? 'stroke-red-500' : 'stroke-emerald-500'}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-dashoffset 1s ease-in-out',
                  filter: `drop-shadow(0 0 4px ${isUrgent ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'})`,
                }}
              />
            </svg>

            {/* Center digits — plain spans, no motion */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Clock className={`w-4 h-4 mb-1 ${isUrgent ? 'text-red-500' : 'text-emerald-500'} ${isUrgent ? 'animate-pulse' : ''}`} />
              <span className={`text-lg font-bold tabular-nums leading-none ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {hh}:{mm}
              </span>
              <span className={`text-[10px] tabular-nums mt-0.5 ${isUrgent ? 'text-red-500/50' : 'text-emerald-500/50'}`}>
                :{ss}
              </span>
            </div>
          </div>

          {/* ── Info ─────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isUrgent ? 'bg-red-500/10' : 'bg-emerald-500/10'
              }`}>
                <Shield className={`w-3.5 h-3.5 ${isUrgent ? 'text-red-500' : 'text-emerald-500'}`} />
              </div>
              <h3 className="text-sm font-bold text-[hsl(var(--foreground))]">
                Active {leave.type === 'DAY_OUTING' ? 'Day Pass' : 'Overnight Pass'}
              </h3>
            </div>

            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3 leading-relaxed">
              {isUrgent
                ? 'Return soon — your pass expires shortly!'
                : 'Your gate pass is active. Show QR at the gate.'}
            </p>

            <div className="flex items-center gap-3">
              <Link to="/student/actions/show-qr">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-md ${
                    isUrgent
                      ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/20'
                      : 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-emerald-500/20'
                  } transition-shadow`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Show QR
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </motion.button>
              </Link>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] hidden sm:inline">
                Expires {new Date(leave.endDate).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
