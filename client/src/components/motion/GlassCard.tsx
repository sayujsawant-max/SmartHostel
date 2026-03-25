import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { ease, prefersReducedMotion } from '@/utils/motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  /** Hover lift in px (default 4) */
  lift?: number;
  /** Enable accent glow on hover (default true) */
  glow?: boolean;
  /** Blur intensity: 'normal' | 'strong' (default 'normal') */
  intensity?: 'normal' | 'strong';
}

/**
 * Premium glass-morphism card with frosted backdrop, subtle hover lift,
 * and optional accent glow. Designed for dashboard cards, stat panels,
 * and elevated content.
 */
export function GlassCard({
  children,
  className = '',
  lift = 4,
  glow = true,
  intensity = 'normal',
}: GlassCardProps) {
  const glassClass = intensity === 'strong' ? 'glass-strong' : 'glass';

  if (prefersReducedMotion()) {
    return (
      <div className={`rounded-2xl ${glassClass} ${glow ? 'card-glow' : ''} ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -lift, scale: 1.012 }}
      whileTap={{ scale: 0.988 }}
      transition={ease.springGentle}
      className={`rounded-2xl ${glassClass} ${glow ? 'card-glow' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
