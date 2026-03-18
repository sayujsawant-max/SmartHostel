import type { ReactNode } from 'react';

interface FilterPanelProps {
  children: ReactNode;
  className?: string;
}

/**
 * Themed card wrapper for filter controls (selects, inputs, toggles).
 *
 * Renders children in a horizontal flex-wrap layout inside a card shell.
 * Designed for pages that have 1-5 filter controls side by side.
 *
 * ```tsx
 * <FilterPanel>
 *   <FilterPanel.Select value={v} onChange={setV} options={[...]} />
 *   <input ... />
 * </FilterPanel>
 * ```
 */
export default function FilterPanel({
  children,
  className = '',
}: FilterPanelProps) {
  return (
    <div
      className={`p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] flex flex-wrap items-center gap-3 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Filter Select ─────────────────────────────────────────────── */

interface FilterSelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

/**
 * Themed select element sized for filter panels.
 * Pass <option> elements as children.
 */
function FilterSelect({
  value,
  onChange,
  children,
  className = '',
}: FilterSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--accent))] focus:outline-none transition-shadow ${className}`}
    >
      {children}
    </select>
  );
}

FilterPanel.Select = FilterSelect;
