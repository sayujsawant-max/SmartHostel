import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ease, prefersReducedMotion } from '@/utils/motion';

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  /** Lift distance in px (default 4) */
  lift?: number;
}

/**
 * Card wrapper with subtle hover lift + shadow.
 * Intentionally restrained: small y-shift, tiny scale, no dramatic motion.
 */
export function MotionCard({
  children,
  className,
  lift = 4,
}: MotionCardProps) {
  if (prefersReducedMotion()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{ y: -lift, scale: 1.01 }}
      whileTap={{ scale: 0.985 }}
      transition={ease.springGentle}
      className={className}
    >
      {children}
    </motion.div>
  );
}
