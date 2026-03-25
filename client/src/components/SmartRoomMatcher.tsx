import { useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Users, Bed, Star, Zap, ArrowRight } from 'lucide-react';

interface RoomMatch {
  roomId: string;
  block: string;
  floor: string;
  roomNumber: string;
  roomType: string;
  acType: string;
  totalBeds: number;
  occupiedBeds: number;
  feePerSemester: number;
  matchScore: number;
  reasons: string[];
  currentOccupants: { name: string; academicYear?: string }[];
}

interface Props {
  onSelectRoom: (roomId: string) => void;
}

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function SmartRoomMatcher({ onSelectRoom }: Props) {
  const [matches, setMatches] = useState<RoomMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [preferAC, setPreferAC] = useState(false);
  const [preferQuiet, setPreferQuiet] = useState(false);
  const [budget, setBudget] = useState('');

  const findMatches = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (preferAC) params.set('ac', 'true');
      if (preferQuiet) params.set('quiet', 'true');
      if (budget) params.set('budget', budget);

      const res = await apiFetch<RoomMatch[]>(`/room-matching?${params.toString()}`);
      setMatches(res.data);
      setSearched(true);
    } catch (err) {
      showError(err, 'Failed to find matches');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10';
    return 'text-[hsl(var(--destructive))] bg-[hsl(var(--destructive))]/10';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 75) return <Star size={12} className="fill-current" />;
    if (score >= 50) return <Zap size={12} />;
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Preferences Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm"
      >
        {/* Subtle gradient accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[hsl(var(--accent))]/40 to-transparent" />

        <div className="flex items-center gap-2.5 mb-4">
          <motion.div
            animate={{ rotate: [0, 15, -15, 0] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 4 }}
            className="w-9 h-9 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center"
          >
            <Sparkles size={16} className="text-[hsl(var(--accent))]" />
          </motion.div>
          <div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Your Preferences</h3>
            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">Help us find your perfect room</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { checked: preferAC, onChange: setPreferAC, label: 'Prefer AC Room', icon: '❄️' },
            { checked: preferQuiet, onChange: setPreferQuiet, label: 'Quiet Floor', icon: '🤫' },
          ].map(item => (
            <motion.label
              key={item.label}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={spring}
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                item.checked
                  ? 'bg-[hsl(var(--accent))]/8 border-[hsl(var(--accent))]/30 shadow-sm'
                  : 'bg-[hsl(var(--muted))]/30 border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/20'
              }`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={e => item.onChange(e.target.checked)}
                className="sr-only"
              />
              <span className="text-base">{item.icon}</span>
              <span className="text-xs font-medium text-[hsl(var(--foreground))]">{item.label}</span>
              {item.checked && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="ml-auto w-4 h-4 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center"
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 4L3 5.5L6.5 2" stroke="hsl(var(--accent-foreground))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </motion.label>
          ))}
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1.5 block">Max Budget per Semester</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[hsl(var(--muted-foreground))]">₹</span>
            <input
              type="number"
              value={budget}
              onChange={e => setBudget(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] pl-7 pr-3 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30 focus:border-[hsl(var(--accent))]/50 transition-all"
            />
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
          onClick={() => void findMatches()}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            />
          ) : (
            <>
              <Sparkles size={14} />
              Find My Best Matches
              <ArrowRight size={14} />
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Results */}
      <AnimatePresence mode="wait">
        {searched && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-3"
          >
            {matches.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  No matching rooms found.
                </p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]/60 mt-1">Try adjusting your preferences</p>
              </motion.div>
            ) : (
              <>
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs font-medium text-[hsl(var(--muted-foreground))] flex items-center gap-1.5"
                >
                  <Sparkles size={12} className="text-[hsl(var(--accent))]" />
                  Found {matches.length} matches sorted by compatibility
                </motion.p>
                {matches.map((match, i) => (
                  <motion.div
                    key={match.roomId}
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <motion.div
                      whileHover={{ y: -2, shadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                      transition={spring}
                      className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/30 transition-all duration-200 shadow-sm"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-[hsl(var(--foreground))]">
                            Block {match.block} · Floor {match.floor} · Room {match.roomNumber}
                          </p>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                            {match.roomType} · {match.acType} · ₹{match.feePerSemester.toLocaleString('en-IN')}/sem
                          </p>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.07 + 0.2, type: 'spring', stiffness: 300 }}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm font-bold ${getScoreColor(match.matchScore)}`}
                        >
                          {getScoreIcon(match.matchScore)}
                          {match.matchScore}%
                        </motion.div>
                      </div>

                      {/* Occupancy bar */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <Bed size={12} className="text-[hsl(var(--muted-foreground))] shrink-0" />
                        <div className="flex-1 h-2.5 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-[hsl(var(--accent))]"
                            initial={{ width: 0 }}
                            animate={{ width: `${(match.occupiedBeds / match.totalBeds) * 100}%` }}
                            transition={{ duration: 0.7, delay: i * 0.07 + 0.15, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] tabular-nums">
                          {match.occupiedBeds}/{match.totalBeds}
                        </span>
                      </div>

                      {/* Reasons as pills */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {match.reasons.map((reason, ri) => (
                          <motion.span
                            key={reason}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.07 + 0.1 + ri * 0.03 }}
                            className="px-2.5 py-0.5 rounded-full bg-[hsl(var(--accent))]/8 text-[10px] font-medium text-[hsl(var(--accent))]"
                          >
                            {reason}
                          </motion.span>
                        ))}
                      </div>

                      {/* Current Occupants */}
                      {match.currentOccupants.length > 0 && (
                        <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg bg-[hsl(var(--muted))]/40">
                          <Users size={12} className="text-[hsl(var(--muted-foreground))] shrink-0" />
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">
                            {match.currentOccupants.map(o => `${o.name}${o.academicYear ? ` (${o.academicYear})` : ''}`).join(', ')}
                          </span>
                        </div>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        transition={spring}
                        onClick={() => onSelectRoom(match.roomId)}
                        className="w-full py-2.5 rounded-xl bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] text-xs font-semibold hover:bg-[hsl(var(--accent))]/18 transition-all flex items-center justify-center gap-2"
                      >
                        Select This Room
                        <ArrowRight size={12} />
                      </motion.button>
                    </motion.div>
                  </motion.div>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
