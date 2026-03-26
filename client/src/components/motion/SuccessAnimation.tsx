import { motion, AnimatePresence } from 'motion/react';

interface SuccessAnimationProps {
  show: boolean;
  size?: number;
  className?: string;
  message?: string;
}

/**
 * Animated success checkmark with expanding circle.
 * Shows a green circle that draws itself, followed by a checkmark.
 */
export function SuccessAnimation({
  show,
  size = 80,
  className = '',
  message,
}: SuccessAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`flex flex-col items-center gap-3 ${className}`}
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 56 56"
            fill="none"
            className="success-check"
          >
            <motion.circle
              cx="28"
              cy="28"
              r="26"
              stroke="hsl(142 76% 36%)"
              strokeWidth="2"
              fill="none"
              initial={{ pathLength: 0, rotate: -90 }}
              animate={{ pathLength: 1, rotate: -90 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              style={{ transformOrigin: 'center' }}
            />
            <motion.path
              d="M17 28L24 35L39 20"
              stroke="hsl(142 76% 36%)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
            />
          </svg>
          {message && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.3 }}
              className="text-sm font-medium text-[hsl(142_76%_36%)]"
            >
              {message}
            </motion.p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
