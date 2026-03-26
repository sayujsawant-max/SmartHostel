import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { motion, AnimatePresence } from '@components/ui/motion';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { Reveal } from '@/components/motion';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  UtensilsCrossed,
  Coffee,
  Sun,
  Cookie,
  Moon,
  CalendarDays,
  CheckCircle2,
  Save,
  ChefHat,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};
const MEAL_ICONS: Record<string, typeof Coffee> = {
  breakfast: Coffee,
  lunch: Sun,
  snacks: Cookie,
  dinner: Moon,
};

interface MenuDay {
  dayOfWeek: number;
  breakfast: string;
  lunch: string;
  snacks: string;
  dinner: string;
}

type DayForm = Record<typeof MEALS[number], string>;

const emptyForm = (): DayForm => ({ breakfast: '', lunch: '', snacks: '', dinner: '' });

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] transition-shadow';

export default function MessMenuPage() {
  usePageTitle('Mess Menu');
  const [forms, setForms] = useState<DayForm[]>(Array.from({ length: 7 }, () => emptyForm()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ day: number; type: 'success' | 'error'; message: string } | null>(null);
  const [activeDay, setActiveDay] = useState(new Date().getDay());

  useEffect(() => {
    apiFetch<{ menus: MenuDay[] }>('/mess-menu')
      .then((res) => {
        const updated = Array.from({ length: 7 }, () => emptyForm());
        for (const menu of res.data.menus) {
          updated[menu.dayOfWeek] = {
            breakfast: menu.breakfast,
            lunch: menu.lunch,
            snacks: menu.snacks,
            dinner: menu.dinner,
          };
        }
        setForms(updated);
      })
      .catch((err: unknown) => showError(err, 'Failed to load data'))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (day: number, meal: typeof MEALS[number], value: string) => {
    setForms((prev) => {
      const next = [...prev];
      next[day] = { ...next[day], [meal]: value };
      return next;
    });
  };

  const handleSave = async (day: number) => {
    const form = forms[day];
    if (!form.breakfast || !form.lunch || !form.snacks || !form.dinner) {
      setFeedback({ day, type: 'error', message: 'All meal fields are required.' });
      return;
    }

    setSaving(day);
    setFeedback(null);
    try {
      await apiFetch(`/mess-menu/${day}`, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      setFeedback({ day, type: 'success', message: 'Menu saved successfully.' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save menu.';
      setFeedback({ day, type: 'error', message });
    } finally {
      setSaving(null);
    }
  };

  const configuredDays = forms.filter((f) => f.breakfast || f.lunch || f.snacks || f.dinner).length;
  const totalItems = forms.reduce((sum, f) => {
    return sum + (f.breakfast ? 1 : 0) + (f.lunch ? 1 : 0) + (f.snacks ? 1 : 0) + (f.dinner ? 1 : 0);
  }, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
          <PageHeader title="Mess Menu Management" description="Update the weekly mess menu for all hostels." />
        </motion.div>
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-600/10 via-[hsl(var(--card))] to-orange-600/10 border border-[hsl(var(--border))] p-6 morph-gradient"
      >
        <div className="absolute top-4 right-4 opacity-10">
          <motion.div
            animate={{ rotate: [0, 8, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChefHat className="w-24 h-24 text-amber-500" />
          </motion.div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center"
            whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <UtensilsCrossed className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] gradient-heading">Mess Menu Management</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Update the weekly mess menu for all hostels</p>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Total Menu Items', value: totalItems, icon: UtensilsCrossed, iconBg: 'bg-blue-100 dark:bg-blue-950/40', iconColor: 'text-blue-600 dark:text-blue-400' },
          { label: 'Days Configured', value: configuredDays, icon: CalendarDays, suffix: '/7', iconBg: 'bg-emerald-100 dark:bg-emerald-950/40', iconColor: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.08 * i, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <motion.div
                whileHover={{ y: -3, scale: 1.02 }}
                transition={spring}
                className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:shadow-md transition-shadow card-glow card-shine"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</p>
                    <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                      <AnimatedCounter to={stat.value} />
                      {stat.suffix}
                    </p>
                  </div>
                  <motion.div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.iconBg} ${stat.iconColor}`}
                    whileHover={{ rotate: [0, -8, 8, -4, 0], scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Day Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex gap-1 p-1.5 rounded-2xl bg-[hsl(var(--muted))]/50 border border-[hsl(var(--border))] overflow-x-auto"
      >
        {DAY_SHORT.map((name, idx) => (
          <motion.button
            key={idx}
            onClick={() => setActiveDay(idx)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className={`relative flex-1 min-w-[3rem] px-2 py-2 rounded-xl text-xs font-medium transition-colors ${
              activeDay === idx
                ? 'text-[hsl(var(--primary-foreground))]'
                : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            }`}
          >
            {activeDay === idx && (
              <motion.div
                layoutId="active-day-tab"
                className="absolute inset-0 bg-[hsl(var(--primary))] rounded-xl shadow-lg shadow-[hsl(var(--primary))]/20"
                transition={spring}
              />
            )}
            <span className="relative z-10">{name}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Active Day Content */}
      <Reveal>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeDay}
          initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="card-glow card-shine p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">{DAY_NAMES[activeDay]}</h2>
            </div>
            <motion.button
              onClick={() => void handleSave(activeDay)}
              disabled={saving === activeDay}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
            >
              {saving === activeDay ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Save className="w-4 h-4" />
                </motion.div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving === activeDay ? 'Saving...' : 'Save'}
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MEALS.map((meal, mealIdx) => {
              const MealIcon = MEAL_ICONS[meal];
              return (
                <motion.div
                  key={meal}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * mealIdx, duration: 0.3 }}
                >
                  <motion.div
                    whileHover={{ y: -2 }}
                    transition={spring}
                    className="p-3 rounded-xl bg-[hsl(var(--muted))]/30 border border-[hsl(var(--border))]/50 hover:border-[hsl(var(--accent))]/40 transition-colors"
                  >
                    <label className="flex items-center gap-2 text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                      <motion.div
                        whileHover={{ rotate: 15 }}
                        transition={spring}
                        className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center"
                      >
                        <MealIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      </motion.div>
                      {MEAL_LABELS[meal]}
                    </label>
                    <input
                      type="text"
                      value={forms[activeDay][meal]}
                      onChange={(e) => handleChange(activeDay, meal, e.target.value)}
                      placeholder={`Enter ${MEAL_LABELS[meal].toLowerCase()} items...`}
                      className={inputCls}
                    />
                  </motion.div>
                </motion.div>
              );
            })}
          </div>

          <AnimatePresence>
          {feedback?.day === activeDay && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className={`flex items-center gap-2 text-sm p-3 rounded-xl ${
                feedback.type === 'success'
                  ? 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40'
                  : 'text-[hsl(var(--destructive))] bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40'
              }`}
            >
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
              {feedback.message}
            </motion.div>
          )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
      </Reveal>
    </div>
  );
}
