import type { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

/* ─── Shared styling tokens ─────────────────────────────────────── */

const baseInput =
  'w-full px-3 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] focus:border-transparent transition-shadow';

/* ─── Types ─────────────────────────────────────────────────────── */

interface BaseProps {
  label: string;
  id: string;
  /** Validation error message */
  error?: string;
  /** Hint text below the input (hidden when error is shown) */
  hint?: string;
  className?: string;
}

interface InputFieldProps extends BaseProps {
  as?: 'input';
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  children?: never;
}

interface SelectFieldProps extends BaseProps {
  as: 'select';
  type?: never;
  inputProps?: SelectHTMLAttributes<HTMLSelectElement>;
  /** <option> elements */
  children: ReactNode;
}

export type FormFieldProps = InputFieldProps | SelectFieldProps;

/**
 * Reusable form field with label, input/select, error, and hint.
 *
 * Works with react-hook-form by spreading `register(...)` into `inputProps`:
 * ```tsx
 * <FormField label="Email" id="email" error={errors.email?.message}
 *   inputProps={{ ...register('email'), type: 'email', autoComplete: 'email' }}
 * />
 * ```
 */
export default function FormField(props: FormFieldProps) {
  const { label, id, error, hint, className = '' } = props;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1"
      >
        {label}
      </label>

      {props.as === 'select' ? (
        <select
          id={id}
          className={baseInput}
          {...props.inputProps}
        >
          {props.children}
        </select>
      ) : (
        <input
          id={id}
          type={props.type ?? 'text'}
          className={baseInput}
          {...props.inputProps}
        />
      )}

      {error ? (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{hint}</p>
      ) : null}
    </div>
  );
}
