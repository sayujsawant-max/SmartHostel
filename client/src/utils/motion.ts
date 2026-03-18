import type { Transition, Variant } from 'motion/react';

/* ─── Reduced-motion helper ─────────────────────────────────────── */

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── Duration tokens (seconds) ─────────────────────────────────── */

export const duration = {
  fast: 0.2,
  normal: 0.4,
  slow: 0.6,
  showcase: 0.8,
} as const;

/* ─── Easing tokens ─────────────────────────────────────────────── */

export const ease = {
  out: [0.22, 1, 0.36, 1] as [number, number, number, number],
  inOut: [0.65, 0, 0.35, 1] as [number, number, number, number],
  spring: { type: 'spring' as const, stiffness: 400, damping: 28 },
  springGentle: { type: 'spring' as const, stiffness: 260, damping: 24 },
};

/* ─── Transition presets ────────────────────────────────────────── */

export const transition: Record<string, Transition> = {
  fast: { duration: duration.fast, ease: ease.out },
  normal: { duration: duration.normal, ease: ease.out },
  slow: { duration: duration.slow, ease: ease.out },
  showcase: { duration: duration.showcase, ease: ease.out },
  spring: ease.spring,
  springGentle: ease.springGentle,
};

/* ─── Reveal variants (used by Reveal component) ────────────────── */

const offset = 24; // px – subtle, premium

export const revealVariants: Record<
  string,
  { hidden: Variant; visible: (delay?: number) => Variant }
> = {
  up: {
    hidden: { opacity: 0, y: offset },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: duration.slow, delay, ease: ease.out },
    }),
  },
  down: {
    hidden: { opacity: 0, y: -offset },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      transition: { duration: duration.slow, delay, ease: ease.out },
    }),
  },
  left: {
    hidden: { opacity: 0, x: offset },
    visible: (delay = 0) => ({
      opacity: 1,
      x: 0,
      transition: { duration: duration.slow, delay, ease: ease.out },
    }),
  },
  right: {
    hidden: { opacity: 0, x: -offset },
    visible: (delay = 0) => ({
      opacity: 1,
      x: 0,
      transition: { duration: duration.slow, delay, ease: ease.out },
    }),
  },
  none: {
    hidden: { opacity: 0 },
    visible: (delay = 0) => ({
      opacity: 1,
      transition: { duration: duration.slow, delay, ease: ease.out },
    }),
  },
};

/* ─── Stagger variants ──────────────────────────────────────────── */

export const staggerContainer = (stagger = 0.07, delay = 0) => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

export const staggerItem: { hidden: Variant; visible: Variant } = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
};

/* ─── Hover presets ─────────────────────────────────────────────── */

export const hoverLift = {
  whileHover: { y: -4, scale: 1.015 },
  whileTap: { scale: 0.985 },
  transition: ease.springGentle,
};

export const hoverSubtle = {
  whileHover: { y: -2 },
  transition: ease.springGentle,
};
