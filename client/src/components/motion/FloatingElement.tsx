import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { prefersReducedMotion } from '@/utils/motion';

interface FloatingElementProps {
  children: ReactNode;
  className?: string;
  /** Amplitude in pixels */
  amplitude?: number;
  /** Duration of one cycle in seconds */
  duration?: number;
  /** Delay before animation starts */
  delay?: number;
  /** Float direction */
  axis?: 'y' | 'x' | 'both';
  /** Optional rotation range in degrees */
  rotate?: number;
}

/**
 * Makes an element float with a gentle, organic animation.
 * Great for decorative elements, icons, and background shapes.
 */
export function FloatingElement({
  children,
  className,
  amplitude = 8,
  duration = 4,
  delay = 0,
  axis = 'y',
  rotate = 0,
}: FloatingElementProps) {
  if (prefersReducedMotion()) {
    return <div className={className}>{children}</div>;
  }

  const animateProps: Record<string, number[]> = {};
  if (axis === 'y' || axis === 'both') animateProps.y = [0, -amplitude, 0];
  if (axis === 'x' || axis === 'both') animateProps.x = [0, amplitude * 0.6, 0];
  if (rotate) animateProps.rotate = [-rotate, rotate, -rotate];

  return (
    <motion.div
      animate={animateProps}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
