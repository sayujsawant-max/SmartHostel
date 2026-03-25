import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import PageHeader from '@components/ui/PageHeader';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';
import {
  Sun,
  UtensilsCrossed,
  Coffee,
  Moon,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Sparkles,
} from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};
const MEAL_TIMES: Record<string, string> = {
  breakfast: '7:30 - 9:00 AM',
  lunch: '12:00 - 2:00 PM',
  snacks: '4:30 - 5:30 PM',
  dinner: '7:30 - 9:30 PM',
};
const MEAL_ICONS: Record<string, typeof Sun> = {
  breakfast: Coffee,
  lunch: Sun,
  snacks: Sparkles,
  dinner: Moon,
};
const MEAL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  breakfast: {
    bg: 'bg-amber-100 dark:bg-amber-950/40',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800/40',
  },
  lunch: {
    bg: 'bg-orange-100 dark:bg-orange-950/40',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800/40',
  },
  snacks: {
    bg: 'bg-violet-100 dark:bg-violet-950/40',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-200 dark:border-violet-800/40',
  },
  dinner: {
    bg: 'bg-indigo-100 dark:bg-indigo-950/40',
    text: 'text-indigo-600 dark:text-indigo-400',
    border: 'border-indigo-200 dark:border-indigo-800/40',
  },
};

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

interface MealRating {
  up: number;
  down: number;
}

interface MenuDay {
  _id: string;
  dayOfWeek: number;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
  ratings: Record<string, MealRating>;
}

export default function MessMenuPage() {
  const [menus, setMenus] = useState<MenuDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [myRatings, setMyRatings] = useState<Record<string, Record<string, 'up' | 'down'>>>({});
  const [ratingInFlight, setRatingInFlight] = useState<string | null>(null);

  const today = new Date().getDay();

  useEffect(() => {
    apiFetch<{ menus: MenuDay[] }>('/mess-menu')
      .then((res) => setMenus(res.data.menus))
      .catch((err) => { showError(err, 'Failed to load menu'); })
      .finally(() => setLoading(false));
  }, []);

  const handleRate = async (dayOfWeek: number, meal: string, rating: 'up' | 'down') => {
    const key = `${dayOfWeek}-${meal}`;
    if (ratingInFlight === key) return;

    const current = myRatings[dayOfWeek]?.[meal];
    if (current === rating) return;

    setRatingInFlight(key);
    try {
      await apiFetch(`/mess-menu/${dayOfWeek}/rate`, {
        method: 'POST',
        body: JSON.stringify({ meal, rating }),
      });

      setMyRatings((prev) => ({
        ...prev,
        [dayOfWeek]: { ...prev[dayOfWeek], [meal]: rating },
      }));

      setMenus((prev) =>
        prev.map((m) => {
          if (m.dayOfWeek !== dayOfWeek) return m;
          const updated = { ...m, ratings: { ...m.ratings } };
          const oldRating = current;
          if (oldRating === 'up') updated.ratings[meal] = { ...updated.ratings[meal], up: updated.ratings[meal].up - 1 };
          if (oldRating === 'down') updated.ratings[meal] = { ...updated.ratings[meal], down: updated.ratings[meal].down - 1 };
          if (rating === 'up') updated.ratings[meal] = { ...updated.ratings[meal], up: updated.ratings[meal].up + 1 };
          if (rating === 'down') updated.ratings[meal] = { ...updated.ratings[meal], down: updated.ratings[meal].down + 1 };
          return updated;
        }),
      );
    } catch (err) {
      showError(err, 'Failed to submit rating');
    } finally {
      setRatingInFlight(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <PageHeader title="Mess Menu" description="View today's menu and rate meals." />
        </motion.div>
        <PageSkeleton />
      </div>
    );
  }

  const todayMenu = menus.find((m) => m.dayOfWeek === today);
  const selectedMenu = menus.find((m) => m.dayOfWeek === selectedDay);

  return (
    <div className="space-y-6">
      {/* Today's Menu */}
      {todayMenu && (
        <section>
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <PageHeader
              title={`Today's Menu — ${DAY_NAMES[today]}`}
              description="Rate each meal to share your feedback."
            />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {MEALS.map((meal, i) => {
              const r = todayMenu.ratings[meal] || { up: 0, down: 0 };
              const myVote = myRatings[today]?.[meal];
              const colors = MEAL_COLORS[meal];
              const Icon = MEAL_ICONS[meal];
              const isVoting = ratingInFlight === `${today}-${meal}`;

              return (
                <motion.div
                  key={meal}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.1 * i,
                    ease: [0.25, 0.46, 0.45, 0.94],
                  }}
                >
                  <motion.div
                    whileHover={{ y: -3, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                    className="group p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-md hover:border-transparent transition-shadow duration-200 space-y-3 card-glow"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <motion.div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors.bg} ${colors.text}`}
                          whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Icon className="w-4.5 h-4.5" />
                        </motion.div>
                        <h3 className="font-semibold text-[hsl(var(--foreground))]">{MEAL_LABELS[meal]}</h3>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))]">
                        <Clock className="w-3 h-3" />
                        <span>{MEAL_TIMES[meal]}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{todayMenu[meal]}</p>

                    {/* Rating buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <motion.button
                        onClick={() => void handleRate(today, meal, 'up')}
                        disabled={isVoting}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.9 }}
                        transition={spring}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          myVote === 'up'
                            ? 'bg-emerald-100 text-emerald-700 border border-emerald-300 shadow-sm dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
                            : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-400'
                        }`}
                      >
                        <ThumbsUp className={`w-3.5 h-3.5 ${myVote === 'up' ? 'fill-current' : ''}`} />
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={r.up}
                            initial={{ y: -8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {r.up}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>

                      <motion.button
                        onClick={() => void handleRate(today, meal, 'down')}
                        disabled={isVoting}
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.9 }}
                        transition={spring}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          myVote === 'down'
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 shadow-sm dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700'
                            : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
                        }`}
                      >
                        <ThumbsDown className={`w-3.5 h-3.5 ${myVote === 'down' ? 'fill-current' : ''}`} />
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={r.down}
                            initial={{ y: -8, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 8, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            {r.down}
                          </motion.span>
                        </AnimatePresence>
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* Weekly Menu */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-3 flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-indigo-500" />
          Weekly Menu
        </h2>

        {/* Day tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {DAY_NAMES.map((name, i) => (
            <motion.button
              key={i}
              onClick={() => setSelectedDay(i)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
              className={`relative px-3.5 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                selectedDay === i
                  ? 'text-white'
                  : i === today
                    ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] ring-1 ring-indigo-400/50'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {selectedDay === i && (
                <motion.div
                  layoutId="weekly-day-tab"
                  className="absolute inset-0 rounded-xl bg-indigo-600 dark:bg-indigo-500"
                  transition={spring}
                  style={{ zIndex: -1 }}
                />
              )}
              {name.slice(0, 3)}
              {i === today && selectedDay !== i && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-indigo-500" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Selected day detail */}
        <AnimatePresence mode="wait">
          {selectedMenu ? (
            <motion.div
              key={selectedDay}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="space-y-2"
            >
              <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">{DAY_NAMES[selectedDay]}</h3>
              {MEALS.map((meal, i) => {
                const r = selectedMenu.ratings[meal] || { up: 0, down: 0 };
                const colors = MEAL_COLORS[meal];
                const Icon = MEAL_ICONS[meal];

                return (
                  <motion.div
                    key={meal}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.06 * i }}
                  >
                    <motion.div
                      whileHover={{ x: 3, scale: 1.005 }}
                      transition={spring}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-sm transition-shadow duration-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${colors.bg} ${colors.text}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-[hsl(var(--foreground))]">{MEAL_LABELS[meal]}</span>
                          <p className="text-sm text-[hsl(var(--muted-foreground))] leading-snug">{selectedMenu[meal]}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0 ml-3">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <ThumbsUp className="w-3 h-3" /> {r.up}
                        </span>
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                          <ThumbsDown className="w-3 h-3" /> {r.down}
                        </span>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
            >
              <EmptyState variant="compact" title="No menu available" description={`No menu set for ${DAY_NAMES[selectedDay]}.`} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </div>
  );
}
