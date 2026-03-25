import { useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { motion, AnimatePresence } from 'motion/react';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { UtensilsCrossed, Leaf, Wheat, Egg, Fish, AlertCircle, Check, Save } from 'lucide-react';

interface MealPref {
  dietaryType: 'VEG' | 'NON_VEG' | 'VEGAN' | 'EGGETARIAN';
  allergies: string[];
  spiceLevel: 'MILD' | 'MEDIUM' | 'SPICY';
  mealPlan: 'FULL' | 'LUNCH_DINNER' | 'BREAKFAST_LUNCH';
  specialNotes: string;
}

const DIET_OPTIONS = [
  { value: 'VEG', label: 'Vegetarian', icon: Leaf, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-950/40' },
  { value: 'NON_VEG', label: 'Non-Veg', icon: Fish, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-950/40' },
  { value: 'EGGETARIAN', label: 'Eggetarian', icon: Egg, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-950/40' },
  { value: 'VEGAN', label: 'Vegan', icon: Wheat, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-950/40' },
];

const ALLERGY_OPTIONS = ['Peanuts', 'Gluten', 'Dairy', 'Shellfish', 'Soy', 'Tree Nuts', 'Eggs', 'Fish'];

const SPICE_LEVELS = [
  { value: 'MILD', label: 'Mild', emoji: '🫑' },
  { value: 'MEDIUM', label: 'Medium', emoji: '🌶️' },
  { value: 'SPICY', label: 'Spicy', emoji: '🔥' },
];

const MEAL_PLANS = [
  { value: 'FULL', label: 'Full Day', desc: 'Breakfast + Lunch + Dinner' },
  { value: 'LUNCH_DINNER', label: 'Lunch & Dinner', desc: 'Skip breakfast' },
  { value: 'BREAKFAST_LUNCH', label: 'Breakfast & Lunch', desc: 'Skip dinner' },
];

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function MealPreferencesPage() {
  const [pref, setPref] = useState<MealPref>({
    dietaryType: 'VEG',
    allergies: [],
    spiceLevel: 'MEDIUM',
    mealPlan: 'FULL',
    specialNotes: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiFetch<MealPref>('/assistant/meal-preferences')
      .then(res => setPref(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleAllergy = (allergy: string) => {
    setPref(p => ({
      ...p,
      allergies: p.allergies.includes(allergy) ? p.allergies.filter(a => a !== allergy) : [...p.allergies, allergy],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch('/assistant/meal-preferences', { method: 'PUT', body: JSON.stringify(pref), headers: { 'Content-Type': 'application/json' } });
      showSuccess('Meal preferences saved!');
    } catch (err) {
      showError(err, 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-5">
      <Reveal>
        <PageHeader title="Meal Preferences" description="Customize your dietary preferences and meal plan" />
      </Reveal>

      {/* Dietary Type */}
      <Reveal delay={0.05}>
        <div className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent))]/10 flex items-center justify-center">
              <UtensilsCrossed size={14} className="text-[hsl(var(--accent))]" />
            </div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Dietary Type</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {DIET_OPTIONS.map(opt => {
              const Icon = opt.icon;
              const selected = pref.dietaryType === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  transition={spring}
                  onClick={() => setPref(p => ({ ...p, dietaryType: opt.value as MealPref['dietaryType'] }))}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 ${
                    selected
                      ? 'bg-[hsl(var(--accent))]/8 border-[hsl(var(--accent))]/30 shadow-sm'
                      : 'bg-[hsl(var(--muted))]/30 border-[hsl(var(--border))] hover:border-[hsl(var(--accent))]/20'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg ${opt.bg} flex items-center justify-center`}>
                    <Icon size={14} className={opt.color} />
                  </div>
                  <span className="text-sm font-medium text-[hsl(var(--foreground))]">{opt.label}</span>
                  {selected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-5 h-5 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
                      <Check size={10} className="text-[hsl(var(--accent-foreground))]" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Allergies */}
      <Reveal delay={0.1}>
        <div className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
              <AlertCircle size={14} className="text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Allergies</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALLERGY_OPTIONS.map(allergy => {
              const selected = pref.allergies.includes(allergy);
              return (
                <motion.button
                  key={allergy}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={spring}
                  onClick={() => toggleAllergy(allergy)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                    selected
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] border border-transparent hover:border-[hsl(var(--border))]'
                  }`}
                >
                  {allergy}
                </motion.button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Spice Level */}
      <Reveal delay={0.15}>
        <div className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Spice Level</h3>
          <div className="flex gap-3">
            {SPICE_LEVELS.map(level => {
              const selected = pref.spiceLevel === level.value;
              return (
                <motion.button
                  key={level.value}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  transition={spring}
                  onClick={() => setPref(p => ({ ...p, spiceLevel: level.value as MealPref['spiceLevel'] }))}
                  className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 ${
                    selected
                      ? 'bg-[hsl(var(--accent))]/8 border-[hsl(var(--accent))]/30 shadow-sm'
                      : 'bg-[hsl(var(--muted))]/30 border-[hsl(var(--border))]'
                  }`}
                >
                  <span className="text-xl">{level.emoji}</span>
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">{level.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Meal Plan */}
      <Reveal delay={0.2}>
        <div className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Meal Plan</h3>
          <div className="space-y-2">
            {MEAL_PLANS.map(plan => {
              const selected = pref.mealPlan === plan.value;
              return (
                <motion.button
                  key={plan.value}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  transition={spring}
                  onClick={() => setPref(p => ({ ...p, mealPlan: plan.value as MealPref['mealPlan'] }))}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 ${
                    selected
                      ? 'bg-[hsl(var(--accent))]/8 border-[hsl(var(--accent))]/30 shadow-sm'
                      : 'bg-[hsl(var(--muted))]/30 border-[hsl(var(--border))]'
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{plan.label}</p>
                    <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{plan.desc}</p>
                  </div>
                  {selected && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-5 h-5 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center">
                      <Check size={10} className="text-[hsl(var(--accent-foreground))]" />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </Reveal>

      {/* Special Notes */}
      <Reveal delay={0.25}>
        <div className="card-glow p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm">
          <h3 className="text-sm font-semibold text-[hsl(var(--foreground))] mb-3">Special Notes</h3>
          <textarea
            value={pref.specialNotes}
            onChange={e => setPref(p => ({ ...p, specialNotes: e.target.value }))}
            placeholder="Any special dietary requirements or notes for the mess..."
            rows={3}
            className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3.5 py-2.5 text-sm text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/30 focus:border-[hsl(var(--accent))]/50 transition-all resize-none"
          />
        </div>
      </Reveal>

      {/* Save Button */}
      <Reveal delay={0.3}>
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          transition={spring}
          onClick={() => void handleSave()}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-semibold hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          {saving ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
          ) : (
            <>
              <Save size={14} />
              Save Preferences
            </>
          )}
        </motion.button>
      </Reveal>
    </div>
  );
}
