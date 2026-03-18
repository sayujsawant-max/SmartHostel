import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { duration, ease, prefersReducedMotion } from '@/utils/motion';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wraps page content with a fade + slight y-offset entrance.
 * Designed for use inside route-level components.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  if (prefersReducedMotion()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: duration.normal, ease: ease.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
