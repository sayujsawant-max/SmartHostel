import { motion } from 'motion/react';
import { useAuth } from '@hooks/useAuth';
import { Shield, Building2, Layers, DoorOpen, GraduationCap, User, Fingerprint } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 300, damping: 25 };

export default function DigitalIdCard() {
  const { user } = useAuth();
  if (!user) return null;

  const initials = user.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const details = [
    { icon: Building2, label: 'Block', value: user.block ?? '—' },
    { icon: Layers, label: 'Floor', value: user.floor ?? '—' },
    { icon: DoorOpen, label: 'Room', value: user.roomNumber ?? '—' },
    { icon: GraduationCap, label: 'Year', value: user.academicYear ? user.academicYear.charAt(0) + user.academicYear.slice(1).toLowerCase() : '—' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="relative overflow-hidden rounded-2xl cursor-default select-none"
    >
      {/* Card body */}
      <div className="relative bg-gradient-to-br from-[hsl(var(--primary))] via-indigo-600 to-violet-700 dark:from-indigo-900 dark:via-violet-800 dark:to-purple-900 p-5 text-white">

        {/* Dot pattern — pure CSS background instead of inline SVG */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, white 0.8px, transparent 0.8px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Shimmer — CSS animation instead of motion animate loop */}
        <div className="absolute inset-0 opacity-20 pointer-events-none shimmer" />

        {/* ── Header ────────────────────────────── */}
        <div className="relative flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
              <Shield className="w-4 h-4 text-white/90" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/80">SmartHostel</p>
              <p className="text-[9px] text-white/60 tracking-wide">Student Identity Card</p>
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-[9px] font-bold tracking-wider uppercase">
            {user.role === 'STUDENT' ? 'Student' : user.role}
          </div>
        </div>

        {/* ── Avatar + Name ─────────────────────── */}
        <div className="relative flex items-center gap-4">
          <div className="relative w-[68px] h-[68px] rounded-xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg shadow-black/10">
            <span className="text-xl font-bold text-white drop-shadow-sm">{initials}</span>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white/30 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold truncate drop-shadow-sm">{user.name}</h3>
            <p className="text-xs text-white/75 truncate mt-0.5">{user.email}</p>
          </div>
        </div>

        {/* ── Details grid ──────────────────────── */}
        <div className="relative grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10">
          {details.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="text-center group">
                <div className="mx-auto mb-1.5 w-7 h-7 rounded-lg bg-white/[0.07] flex items-center justify-center group-hover:bg-white/15 transition-colors duration-200">
                  <Icon className="w-3.5 h-3.5 text-white/70 group-hover:text-white/90 transition-colors duration-200" />
                </div>
                <p className="text-[9px] text-white/60 uppercase tracking-wide font-medium">{item.label}</p>
                <p className="text-xs font-bold mt-0.5 text-white">{item.value}</p>
              </div>
            );
          })}
        </div>

        {/* ── Footer ────────────────────────────── */}
        <div className="relative flex items-center justify-between mt-4 pt-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-white/60" />
            <span className="text-[9px] text-white/65 font-medium">{user.gender ?? 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3">
            <Fingerprint className="w-3.5 h-3.5 text-white/45" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] text-white/65 font-medium">Verified</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
