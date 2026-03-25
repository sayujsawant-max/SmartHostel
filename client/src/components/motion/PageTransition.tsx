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
      initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
      transition={{ duration: duration.normal, ease: ease.out }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
