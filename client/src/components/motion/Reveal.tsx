import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'motion/react';
import {
  revealVariants,
  prefersReducedMotion,
} from '@/utils/motion';

export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

export interface RevealProps {
  children: ReactNode;
  className?: string;
  direction?: RevealDirection;
  /** Delay in seconds before reveal starts */
  delay?: number;
  /** Duration override (currently maps to delay for compatibility) */
  duration?: number;
  once?: boolean;
  as?: 'div' | 'section' | 'span';
}

/**
 * Scroll-triggered reveal animation.
 * Defaults to `once: true` so elements animate in and stay visible.
 * Respects reduced-motion: renders children immediately when enabled.
 */
export function Reveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration: _duration,
  once = true,
  as = 'div',
}: RevealProps) {
  void _duration;
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once, margin: '-60px 0px' });

  if (prefersReducedMotion()) {
    const Tag = as === 'span' ? 'span' : as === 'section' ? 'section' : 'div';
    return <Tag className={className}>{children}</Tag>;
  }

  const variants = revealVariants[direction];
  const MotionTag =
    as === 'span' ? motion.span : as === 'section' ? motion.section : motion.div;

  return (
    <MotionTag
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: variants.hidden,
        visible: variants.visible(delay),
      }}
      className={className}
    >
      {children}
    </MotionTag>
  );
}
