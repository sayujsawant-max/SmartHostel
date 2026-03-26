import { useEffect, useState } from 'react';
import { usePageTitle } from '@hooks/usePageTitle';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { motion } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { Medal, Crown, Flame, Star } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  studentId: string;
  name: string;
  block: string;
  roomNumber: string;
  points: number;
  streak: number;
  badges: number;
  isCurrentUser: boolean;
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

const RANK_STYLES = [
  { bg: 'bg-amber-100 dark:bg-amber-950/40', text: 'text-amber-600 dark:text-amber-400', icon: Crown },
  { bg: 'bg-gray-100 dark:bg-gray-800/60', text: 'text-gray-500 dark:text-gray-400', icon: Medal },
  { bg: 'bg-orange-100 dark:bg-orange-950/40', text: 'text-orange-600 dark:text-orange-400', icon: Medal },
];

export default function LeaderboardPage() {
  usePageTitle('Leaderboard');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<LeaderboardEntry[]>('/gamification/leaderboard')
      .then(res => setEntries(Array.isArray(res.data) ? res.data : []))
      .catch(err => showError(err, 'Failed to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="Leaderboard" description="Top students ranked by points, streaks, and achievements" />
      </Reveal>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <Reveal delay={0.05}>
          <div className="flex items-end justify-center gap-3 py-4">
            {[1, 0, 2].map(idx => {
              const entry = entries[idx];
              const style = RANK_STYLES[idx];
              const Icon = style.icon;
              const heights = ['h-28', 'h-36', 'h-24'];
              return (
                <motion.div
                  key={entry.studentId}
                  initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.2 + idx * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    animate={idx === 0 ? { y: [0, -4, 0] } : {}}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    className={`w-12 h-12 rounded-2xl ${style.bg} flex items-center justify-center mb-2`}
                  >
                    <Icon size={20} className={style.text} />
                  </motion.div>
                  <p className="text-sm font-bold text-[hsl(var(--foreground))] text-center">{entry.name}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">{entry.points} pts</p>
                  <div className={`${heights[idx]} w-20 mt-2 rounded-t-xl bg-gradient-to-t from-[hsl(var(--accent))]/20 to-[hsl(var(--accent))]/5 border border-b-0 border-[hsl(var(--border))] flex items-center justify-center`}>
                    <span className="text-2xl font-black text-[hsl(var(--accent))] tabular-nums">#{entry.rank}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Reveal>
      )}

      {/* Full List */}
      <StaggerContainer stagger={0.04} className="space-y-2">
        {entries.map((entry) => (
          <StaggerItem key={entry.studentId}>
            <motion.div
              whileHover={{ y: -1, scale: 1.005 }}
              transition={spring}
              className={`flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-200 ${
                entry.isCurrentUser
                  ? 'bg-[hsl(var(--accent))]/8 border-[hsl(var(--accent))]/30 shadow-sm'
                  : 'card-glow bg-[hsl(var(--card))] border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/20'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
                entry.rank <= 3
                  ? `${RANK_STYLES[entry.rank - 1].bg} ${RANK_STYLES[entry.rank - 1].text}`
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]'
              }`}>
                #{entry.rank}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))] truncate">
                  {entry.name}
                  {entry.isCurrentUser && <span className="ml-1.5 text-[10px] text-[hsl(var(--accent))] font-bold">(You)</span>}
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Block {entry.block} · Room {entry.roomNumber}</p>
              </div>
              <div className="flex items-center gap-4 text-right shrink-0">
                <div className="flex items-center gap-1">
                  <Flame size={12} className="text-amber-500" />
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))] tabular-nums">{entry.streak}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-[hsl(var(--accent))]" />
                  <span className="text-xs font-semibold text-[hsl(var(--foreground))] tabular-nums">{entry.badges}</span>
                </div>
                <span className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums w-14 text-right">{entry.points}</span>
              </div>
            </motion.div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
  );
}
