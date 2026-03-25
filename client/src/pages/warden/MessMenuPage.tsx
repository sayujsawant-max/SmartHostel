import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { usePageTitle } from '@hooks/usePageTitle';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEALS = ['breakfast', 'lunch', 'snacks', 'dinner'] as const;
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
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

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]';

export default function MessMenuPage() {
  usePageTitle('Mess Menu');
  const [forms, setForms] = useState<DayForm[]>(Array.from({ length: 7 }, () => emptyForm()));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ day: number; type: 'success' | 'error'; message: string } | null>(null);

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

  if (loading) {
    return (
      <div className="space-y-6">
        <Reveal><PageHeader title="Mess Menu Management" description="Update the weekly mess menu for all hostels." /></Reveal>
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader title="Mess Menu Management" description="Update the weekly mess menu for all hostels." />
      </Reveal>

      <StaggerContainer stagger={0.04}>
      {DAY_NAMES.map((name, dayIndex) => (
        <StaggerItem key={dayIndex}>
        <div
          className="card-glow p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">{name}</h2>
            <button
              onClick={() => void handleSave(dayIndex)}
              disabled={saving === dayIndex}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 disabled:opacity-50"
            >
              {saving === dayIndex ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MEALS.map((meal) => (
              <div key={meal}>
                <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1">
                  {MEAL_LABELS[meal]}
                </label>
                <input
                  type="text"
                  value={forms[dayIndex][meal]}
                  onChange={(e) => handleChange(dayIndex, meal, e.target.value)}
                  placeholder={`Enter ${MEAL_LABELS[meal].toLowerCase()} items...`}
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          {feedback?.day === dayIndex && (
            <p className={`text-sm ${feedback.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-[hsl(var(--destructive))]'}`}>
              {feedback.message}
            </p>
          )}
        </div>
        </StaggerItem>
      ))}
      </StaggerContainer>
    </div>
  );
}
