import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ease, prefersReducedMotion } from '@/utils/motion';

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  /** Lift distance in px (default 4) */
  lift?: number;
  /** Enable gradient border glow on hover (default false) */
  glow?: boolean;
}

/**
 * Premium card wrapper with hover lift, scale, and optional glow border.
 * Restrained: small y-shift, tiny scale, smooth spring physics.
 */
export function MotionCard({
  children,
  className,
  lift = 4,
  glow = false,
}: MotionCardProps) {
  if (prefersReducedMotion()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      whileHover={{ y: -lift, scale: 1.012 }}
      whileTap={{ scale: 0.985 }}
      transition={ease.springGentle}
      className={`${glow ? 'card-glow' : ''} ${className ?? ''}`}
    >
      {children}
    </motion.div>
  );
}
