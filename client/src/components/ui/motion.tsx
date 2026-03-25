/**
 * Backward-compatible motion utilities.
 *
 * All original exports (FadeIn, StaggerContainer, StaggerItem, HoverLift,
 * CountUp, PageTransition, ParallaxFloat, AnimatedButton, motion,
 * AnimatePresence) are preserved with identical APIs so that every existing
 * page continues to work without import changes.
 *
 * New code should import from '@/components/motion' instead.
 */

import { useRef, type ReactNode } from 'react';
import { motion, AnimatePresence, useInView } from 'motion/react';

/* ── Fade-in on scroll ─────────────────────────────────────────── */
export function FadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.5,
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  once?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-40px' });

  const dirs = {
    up: { y: 32 },
    down: { y: -32 },
    left: { x: 32 },
    right: { x: -32 },
    none: {},
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, filter: 'blur(6px)', ...dirs[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(6px)', ...dirs[direction] }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Staggered container ───────────────────────────────────────── */
export function StaggerContainer({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
        visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Hover lift card ───────────────────────────────────────────── */
export function HoverLift({
  children,
  className,
  y = -6,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      whileHover={{ y, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Count-up number ───────────────────────────────────────────── */
export { CountUp } from './count-up-legacy';

/* ── Page transition wrapper ───────────────────────────────────── */
export function PageTransition({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const key = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        exit={{ opacity: 0, y: -8, filter: 'blur(2px)' }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Parallax float (subtle background shapes) ─────────────────── */
export function ParallaxFloat({
  children,
  className,
  offset = 20,
}: {
  children?: ReactNode;
  className?: string;
  offset?: number;
}) {
  return (
    <motion.div
      animate={{ y: [0, -offset, 0] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Animated button with press / hover ────────────────────────── */
export function AnimatedButton({
  children,
  className,
  ...props
}: React.ComponentProps<typeof motion.button>) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export { motion, AnimatePresence };
