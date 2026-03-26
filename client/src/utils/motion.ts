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
    hidden: { opacity: 0, y: offset, filter: 'blur(6px)' },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: duration.slow, delay, ease: ease.out },
    }),
  },
  down: {
    hidden: { opacity: 0, y: -offset, filter: 'blur(6px)' },
    visible: (delay = 0) => ({
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: duration.slow, delay, ease: ease.out },
    }),
  },
  left: {
    hidden: { opacity: 0, x: offset, filter: 'blur(6px)' },
    visible: (delay = 0) => ({
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: { duration: duration.slow, delay, ease: ease.out },
    }),
  },
  right: {
    hidden: { opacity: 0, x: -offset, filter: 'blur(6px)' },
    visible: (delay = 0) => ({
      opacity: 1,
      x: 0,
      filter: 'blur(0px)',
      transition: { duration: duration.slow, delay, ease: ease.out },
    }),
  },
  none: {
    hidden: { opacity: 0, filter: 'blur(4px)' },
    visible: (delay = 0) => ({
      opacity: 1,
      filter: 'blur(0px)',
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

/* ─── Premium blur-reveal variant (page entrance) ──────────────── */

export const blurReveal = {
  hidden: { opacity: 0, y: 12, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: duration.slow, ease: ease.out },
  },
};

/* ─── Scale bounce (modals, overlays, success states) ──────────── */

export const scaleBounce = {
  hidden: { opacity: 0, scale: 0.92, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: ease.spring,
  },
};

/* ─── Slide-up fade (bottom sheets, toasts) ────────────────────── */

export const slideUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.normal, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: duration.fast, ease: ease.out },
  },
};

/* ─── Glass card hover (premium card interaction) ──────────────── */

export const hoverGlass = {
  whileHover: { y: -4, scale: 1.012 },
  whileTap: { scale: 0.99 },
  transition: ease.springGentle,
};

/* ─── Premium stagger (blur + y) ───────────────────────────────── */

export const staggerItemBlur: { hidden: Variant; visible: Variant } = {
  hidden: { opacity: 0, y: 16, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: duration.normal, ease: ease.out },
  },
};

/* ─── Page transition (route changes) ──────────────────────────── */

export const pageTransition = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: duration.normal, ease: ease.out },
};

/* ─── Elastic entrance (cards, modals) ─────────────────────────── */

export const elasticEntrance = {
  hidden: { opacity: 0, scale: 0.85, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 300, damping: 20 },
  },
};

/* ─── Slide variants ───────────────────────────────────────────── */

export const slideFromRight = {
  hidden: { opacity: 0, x: 40, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: duration.normal, ease: ease.out },
  },
};

export const slideFromLeft = {
  hidden: { opacity: 0, x: -40, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    x: 0,
    filter: 'blur(0px)',
    transition: { duration: duration.normal, ease: ease.out },
  },
};

/* ─── Pulse scale (notifications, badges) ──────────────────────── */

export const pulseScale = {
  animate: { scale: [1, 1.05, 1] },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
};
