import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import PageHeader from '@components/ui/PageHeader';
import ErrorBanner from '@components/ui/ErrorBanner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

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
  const [error, setError] = useState('');
  const [selectedDay, setSelectedDay] = useState(new Date().getDay());
  const [myRatings, setMyRatings] = useState<Record<string, Record<string, 'up' | 'down'>>>({});
  const [ratingInFlight, setRatingInFlight] = useState<string | null>(null);

  const today = new Date().getDay();

  useEffect(() => {
    apiFetch<{ menus: MenuDay[] }>('/mess-menu')
      .then((res) => setMenus(res.data.menus))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleRate = async (dayOfWeek: number, meal: string, rating: 'up' | 'down') => {
    const key = `${dayOfWeek}-${meal}`;
    if (ratingInFlight === key) return;

    // If clicking the same rating, don't toggle off (API doesn't support remove)
    const current = myRatings[dayOfWeek]?.[meal];
    if (current === rating) return;

    setRatingInFlight(key);
    try {
      await apiFetch(`/mess-menu/${dayOfWeek}/rate`, {
        method: 'POST',
        body: JSON.stringify({ meal, rating }),
      });

      // Update local ratings state
      setMyRatings((prev) => ({
        ...prev,
        [dayOfWeek]: { ...prev[dayOfWeek], [meal]: rating },
      }));

      // Update counts optimistically
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
    } catch {
      // silently fail
    } finally {
      setRatingInFlight(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Reveal><PageHeader title="Mess Menu" description="View today's menu and rate meals." /></Reveal>
        <PageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Reveal><PageHeader title="Mess Menu" description="View today's menu and rate meals." /></Reveal>
        <ErrorBanner message={error} />
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
          <Reveal>
            <PageHeader
              title={`Today's Menu — ${DAY_NAMES[today]}`}
              description="Rate each meal to share your feedback."
            />
          </Reveal>
          <StaggerContainer stagger={0.08} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MEALS.map((meal) => {
              const r = todayMenu.ratings[meal] || { up: 0, down: 0 };
              const myVote = myRatings[today]?.[meal];
              return (
                <StaggerItem key={meal}>
                  <div
                    className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-[hsl(var(--foreground))]">{MEAL_LABELS[meal]}</h3>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{MEAL_TIMES[meal]}</span>
                    </div>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{todayMenu[meal]}</p>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => void handleRate(today, meal, 'up')}
                        disabled={ratingInFlight === `${today}-${meal}`}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          myVote === 'up'
                            ? 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700'
                            : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
                        }`}
                      >
                        <span>&#128077;</span>
                        <span>{r.up}</span>
                      </button>
                      <button
                        onClick={() => void handleRate(today, meal, 'down')}
                        disabled={ratingInFlight === `${today}-${meal}`}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          myVote === 'down'
                            ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700'
                            : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]'
                        }`}
                      >
                        <span>&#128078;</span>
                        <span>{r.down}</span>
                      </button>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </section>
      )}

      {/* Weekly Menu */}
      <Reveal delay={0.1}>
      <section>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-3">Weekly Menu</h2>

        {/* Day tabs */}
        <div className="flex gap-1 overflow-x-auto pb-2 mb-4">
          {DAY_NAMES.map((name, i) => (
            <button
              key={i}
              onClick={() => setSelectedDay(i)}
              className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedDay === i
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : i === today
                    ? 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] ring-1 ring-[hsl(var(--accent))]'
                    : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              {name.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Selected day detail */}
        {selectedMenu ? (
          <div className="space-y-2">
            <h3 className="font-semibold text-[hsl(var(--foreground))]">{DAY_NAMES[selectedDay]}</h3>
            {MEALS.map((meal) => {
              const r = selectedMenu.ratings[meal] || { up: 0, down: 0 };
              return (
                <div
                  key={meal}
                  className="flex items-center justify-between p-3 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]"
                >
                  <div>
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">{MEAL_LABELS[meal]}</span>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">{selectedMenu[meal]}</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] shrink-0 ml-3">
                    <span className="text-green-600 dark:text-green-400">&#128077; {r.up}</span>
                    <span className="text-red-600 dark:text-red-400">&#128078; {r.down}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState variant="compact" title="No menu available" description={`No menu set for ${DAY_NAMES[selectedDay]}.`} />
        )}
      </section>
      </Reveal>
    </div>
  );
}
