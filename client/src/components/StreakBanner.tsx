import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { motion, AnimatePresence } from 'motion/react';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { Trophy, ChevronDown } from 'lucide-react';

interface Badge {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
  description: string;
}

interface StreakData {
  onTimeStreak: number;
  totalApprovedLeaves: number;
  resolvedComplaints: number;
  activeDays: number;
  badges: Badge[];
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function StreakBanner() {
  const [data, setData] = useState<StreakData | null>(null);
  const [showBadges, setShowBadges] = useState(false);

  useEffect(() => {
    apiFetch<StreakData>('/gamification/streak')
      .then(res => setData(res.data))
      .catch(() => {}); // silently fail if not available
  }, []);

  if (!data) return null;

  const earnedBadges = data.badges.filter(b => b.earned);
  const lockedBadges = data.badges.filter(b => !b.earned);
  const streakLevel = data.onTimeStreak >= 15 ? 2 : data.onTimeStreak >= 5 ? 1 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 card-glow"
    >
      {/* Animated gradient accent bar */}
      <motion.div
        className="absolute inset-x-0 top-0 h-1 rounded-t-2xl"
        style={{
          background: streakLevel === 2
            ? 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)), hsl(var(--accent)))'
            : streakLevel === 1
              ? 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--primary)))'
              : 'hsl(var(--accent))',
          backgroundSize: '200% 100%',
        }}
        animate={streakLevel >= 1 ? { backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Streak Counter */}
        <div className="flex items-center gap-4">
          <motion.div
            animate={data.onTimeStreak > 0 ? {
              scale: [1, 1.12, 1],
              rotate: [0, -3, 3, 0],
            } : {}}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
            className="relative"
          >
            <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--accent))]/10 flex items-center justify-center text-3xl">
              {data.onTimeStreak >= 15 ? '🔥' : data.onTimeStreak >= 5 ? '⚡' : '🎯'}
            </div>
            {/* Glow ring for high streaks */}
            {streakLevel >= 1 && (
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-[hsl(var(--accent))]"
                animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.div>

          <div>
            <div className="flex items-baseline gap-2">
              <motion.span
                className="text-3xl font-bold text-[hsl(var(--foreground))] tabular-nums"
                key={data.onTimeStreak}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring}
              >
                <AnimatedCounter to={data.onTimeStreak} />
              </motion.span>
              <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">day streak</span>
            </div>
            <motion.p
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5"
            >
              {data.onTimeStreak === 0
                ? 'Start your streak by returning on time!'
                : data.onTimeStreak >= 15
                  ? "You're on fire! Keep it up!"
                  : `${15 - data.onTimeStreak} more days to earn Time Keeper badge`}
            </motion.p>
          </div>
        </div>

        {/* Mini Stats */}
        <div className="flex items-center gap-5">
          {[
            { value: data.totalApprovedLeaves, label: 'Leaves' },
            { value: data.resolvedComplaints, label: 'Resolved' },
            { value: data.activeDays, label: 'Days' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <div className="text-lg font-bold text-[hsl(var(--foreground))] tabular-nums">
                <AnimatedCounter to={stat.value} />
              </div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-widest font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Badges Toggle */}
        <motion.button
          onClick={() => setShowBadges(prev => !prev)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          transition={spring}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[hsl(var(--muted))] text-xs font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/70 transition-colors"
        >
          <Trophy size={14} className="text-[hsl(var(--accent))]" />
          <span>{earnedBadges.length}/{data.badges.length}</span>
          <motion.div animate={{ rotate: showBadges ? 180 : 0 }} transition={spring}>
            <ChevronDown size={14} />
          </motion.div>
        </motion.button>
      </div>

      {/* Badges Grid */}
      <AnimatePresence>
        {showBadges && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 pt-4 mt-4 border-t border-[hsl(var(--border))]">
              {earnedBadges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20, delay: i * 0.06 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[hsl(var(--accent))]/8 border border-[hsl(var(--accent))]/15 cursor-default"
                  title={badge.description}
                >
                  <span className="text-2xl drop-shadow-sm">{badge.icon}</span>
                  <span className="text-[10px] font-semibold text-[hsl(var(--foreground))] text-center leading-tight">{badge.label}</span>
                </motion.div>
              ))}
              {lockedBadges.map((badge, i) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 0.4, y: 0 }}
                  transition={{ delay: earnedBadges.length * 0.06 + i * 0.04, duration: 0.3 }}
                  className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-[hsl(var(--muted))]/50 cursor-default"
                  title={badge.description}
                >
                  <span className="text-2xl grayscale">{badge.icon}</span>
                  <span className="text-[10px] font-medium text-[hsl(var(--muted-foreground))] text-center leading-tight">{badge.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
