import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, X, RotateCcw } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

const STORAGE_KEY = 'smarthostel-a11y';

interface A11yPrefs {
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  highContrast: boolean;
  reducedMotion: boolean;
  enhancedFocus: boolean;
  screenReaderHints: boolean;
  dyslexiaFont: boolean;
}

const DEFAULT_PREFS: A11yPrefs = {
  fontSize: 'medium',
  highContrast: false,
  reducedMotion: false,
  enhancedFocus: false,
  screenReaderHints: false,
  dyslexiaFont: false,
};

function loadPrefs(): A11yPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    // ignore
  }
  return { ...DEFAULT_PREFS };
}

function savePrefs(prefs: A11yPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

function applyPrefs(prefs: A11yPrefs) {
  const root = document.documentElement;

  // Font size
  root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xlarge');
  root.classList.add(`font-${prefs.fontSize}`);

  // High contrast
  if (prefs.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }

  // Reduced motion
  if (prefs.reducedMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }

  // Enhanced focus
  if (prefs.enhancedFocus) {
    root.classList.add('enhanced-focus');
  } else {
    root.classList.remove('enhanced-focus');
  }

  // Screen reader hints
  if (prefs.screenReaderHints) {
    root.classList.add('sr-hints');
  } else {
    root.classList.remove('sr-hints');
  }

  // Dyslexia font
  if (prefs.dyslexiaFont) {
    root.classList.add('dyslexia-font');
  } else {
    root.classList.remove('dyslexia-font');
  }
}

// ---------------------------------------------------------------------------
// Font size options
// ---------------------------------------------------------------------------

const FONT_SIZES: { value: A11yPrefs['fontSize']; label: string }[] = [
  { value: 'small', label: 'S' },
  { value: 'medium', label: 'M' },
  { value: 'large', label: 'L' },
  { value: 'xlarge', label: 'XL' },
];

// ---------------------------------------------------------------------------
// Toggle switch sub-component
// ---------------------------------------------------------------------------

function Toggle({
  enabled,
  onChange,
  id,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  id: string;
}) {
  return (
    <motion.button
      id={id}
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
        enabled
          ? 'bg-[hsl(var(--primary))]'
          : 'bg-[hsl(var(--muted-foreground)/0.3)]'
      }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={spring}
    >
      <motion.span
        className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm"
        animate={{ x: enabled ? 20 : 2 }}
        transition={spring}
      />
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Setting row
// ---------------------------------------------------------------------------

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[hsl(var(--card-foreground))]">{label}</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))]">{description}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AccessibilityPanel() {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT_PREFS);

  // Load and apply preferences on mount
  useEffect(() => {
    const loaded = loadPrefs();
    setPrefs(loaded);
    applyPrefs(loaded);
  }, []);

  const updatePref = useCallback(
    <K extends keyof A11yPrefs>(key: K, value: A11yPrefs[K]) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        savePrefs(next);
        applyPrefs(next);
        return next;
      });
    },
    [],
  );

  const resetAll = useCallback(() => {
    const reset = { ...DEFAULT_PREFS };
    setPrefs(reset);
    savePrefs(reset);
    applyPrefs(reset);
  }, []);

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 left-4 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={spring}
        aria-label="Accessibility settings"
        animate={{
          boxShadow: [
            '0 0 0 0px hsla(var(--primary), 0.4)',
            '0 0 0 8px hsla(var(--primary), 0)',
          ],
        }}
        // @ts-expect-error motion transition supports repeat
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        style={{}}
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Eye className="h-5 w-5" />
        </motion.div>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />

            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg rounded-t-2xl glass-strong p-5 shadow-2xl card-glow"
              initial={{ y: '100%', filter: 'blur(6px)' }}
              animate={{ y: 0, filter: 'blur(0px)' }}
              exit={{ y: '100%', filter: 'blur(6px)' }}
              transition={spring}
            >
              {/* Header */}
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-[hsl(var(--primary))]" />
                  <h2 className="text-lg font-bold text-[hsl(var(--card-foreground))]">
                    Accessibility
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={resetAll}
                    className="flex items-center gap-1.5 rounded-xl border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))]"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset All
                  </motion.button>
                  <motion.button
                    onClick={() => setOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))]"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={spring}
                    aria-label="Close accessibility panel"
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>

              {/* Settings list */}
              <div className="divide-y divide-[hsl(var(--border))]">
                {/* 1. Font size */}
                <SettingRow
                  label="Font Size"
                  description="Adjust the text size across the app"
                >
                  <div className="flex gap-1">
                    {FONT_SIZES.map((fs) => (
                      <motion.button
                        key={fs.value}
                        onClick={() => updatePref('fontSize', fs.value)}
                        className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-bold transition-colors ${
                          prefs.fontSize === fs.value
                            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                            : 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--card-foreground))] hover:bg-[hsl(var(--accent))]'
                        }`}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        transition={spring}
                      >
                        {fs.label}
                      </motion.button>
                    ))}
                  </div>
                </SettingRow>

                {/* 2. High Contrast */}
                <SettingRow
                  label="High Contrast"
                  description="Increase color contrast for better visibility"
                >
                  <Toggle
                    id="a11y-high-contrast"
                    enabled={prefs.highContrast}
                    onChange={(v) => updatePref('highContrast', v)}
                  />
                </SettingRow>

                {/* 3. Reduced Motion */}
                <SettingRow
                  label="Reduced Motion"
                  description="Minimize animations and transitions"
                >
                  <Toggle
                    id="a11y-reduced-motion"
                    enabled={prefs.reducedMotion}
                    onChange={(v) => updatePref('reducedMotion', v)}
                  />
                </SettingRow>

                {/* 4. Enhanced Focus */}
                <SettingRow
                  label="Focus Indicators"
                  description="Show enhanced outlines on focused elements"
                >
                  <Toggle
                    id="a11y-enhanced-focus"
                    enabled={prefs.enhancedFocus}
                    onChange={(v) => updatePref('enhancedFocus', v)}
                  />
                </SettingRow>

                {/* 5. Screen Reader Hints */}
                <SettingRow
                  label="Screen Reader Hints"
                  description="Add extra descriptions for assistive technology"
                >
                  <Toggle
                    id="a11y-sr-hints"
                    enabled={prefs.screenReaderHints}
                    onChange={(v) => updatePref('screenReaderHints', v)}
                  />
                </SettingRow>

                {/* 6. Dyslexia-Friendly Font */}
                <SettingRow
                  label="Dyslexia-Friendly Font"
                  description="Use a typeface designed for easier reading"
                >
                  <Toggle
                    id="a11y-dyslexia-font"
                    enabled={prefs.dyslexiaFont}
                    onChange={(v) => updatePref('dyslexiaFont', v)}
                  />
                </SettingRow>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
