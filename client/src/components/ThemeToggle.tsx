import { useTheme } from '@context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';

const icons = {
  light: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="5" />
      <path strokeLinecap="round" d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  dark: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
    </svg>
  ),
  system: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path strokeLinecap="round" d="M8 21h8M12 17v4" />
    </svg>
  ),
  scheduled: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 6v6l4 2" />
    </svg>
  ),
};

const labels = { light: 'Light', dark: 'Dark', system: 'System', scheduled: 'Auto (7PM–6AM)' } as const;
const cycle: Record<string, 'light' | 'dark' | 'system' | 'scheduled'> = {
  light: 'dark',
  dark: 'scheduled',
  scheduled: 'system',
  system: 'light',
};

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={() => setTheme(cycle[theme])}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.85, rotate: 180 }}
      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
      className="p-2 rounded-lg text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))] transition-colors"
      aria-label={`Theme: ${labels[theme]}. Click to switch.`}
      title={`Theme: ${labels[theme]}`}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
          transition={{ duration: 0.2 }}
          className="block"
        >
          {icons[theme]}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
