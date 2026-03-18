interface SpinnerProps {
  className?: string;
  /** Size in Tailwind units (default "h-5 w-5") */
  size?: string;
}

/**
 * Reusable animated loading spinner.
 * Renders an accessible SVG circle spinner with configurable size.
 */
export default function Spinner({
  className = '',
  size = 'h-5 w-5',
}: SpinnerProps) {
  return (
    <svg
      className={`animate-spin ${size} ${className}`}
      viewBox="0 0 24 24"
      aria-label="Loading"
      role="status"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}
