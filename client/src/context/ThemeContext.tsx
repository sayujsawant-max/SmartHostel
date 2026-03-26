import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system' | 'scheduled';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** Current resolved appearance (always 'light' or 'dark') */
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'smarthostel-theme';
/** Dark mode hours: 7 PM (19) to 6 AM (6) */
const DARK_START_HOUR = 19;
const DARK_END_HOUR = 6;

function isNightTime(): boolean {
  const h = new Date().getHours();
  return h >= DARK_START_HOUR || h < DARK_END_HOUR;
}

function getStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system' || stored === 'scheduled') return stored;
  } catch {
    // localStorage may be unavailable
  }
  return 'system';
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  switch (theme) {
    case 'dark': return 'dark';
    case 'light': return 'light';
    case 'scheduled': return isNightTime() ? 'dark' : 'light';
    case 'system':
    default:
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme);
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(getStoredTheme()));

  const updateResolved = useCallback((t: Theme) => {
    const resolved = resolveTheme(t);
    setResolvedTheme(resolved);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, []);

  function setTheme(t: Theme) {
    setThemeState(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
    updateResolved(t);
  }

  // Apply on mount (initial resolve is handled by lazy useState init above)
  useEffect(() => {
    const resolved = resolveTheme(theme);
    document.documentElement.classList.toggle('dark', resolved === 'dark');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    function handler() {
      const stored = getStoredTheme();
      if (stored === 'system') {
        updateResolved('system');
      }
    }
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [updateResolved]);

  // Scheduled mode: check every minute for sunrise/sunset transitions
  useEffect(() => {
    if (theme !== 'scheduled') return;
    const id = setInterval(() => updateResolved('scheduled'), 60_000);
    return () => clearInterval(id);
  }, [theme, updateResolved]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
