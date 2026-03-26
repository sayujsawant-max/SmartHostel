import { useRef, useEffect, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { prefersReducedMotion } from '@/utils/motion';

export interface AnimatedCounterProps {
  to?: number;
  /** Alias for to */
  value?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  /** Number of decimal places to display */
  decimals?: number;
  /** Spring duration in seconds (default 1.5) */
  duration?: number;
}

/**
 * Animates a number from 0 → `to` when scrolled into view.
 * - Triggers only once.
 * - Shows the final value immediately when reduced motion is enabled.
 */
export function AnimatedCounter({
  to,
  value,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
  duration = 1.5,
}: AnimatedCounterProps) {
  const target = to ?? value ?? 0;
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const reduced = prefersReducedMotion();
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000 });
  const [display, setDisplay] = useState(0);

  // Reduced motion: show final value immediately whenever target changes
  useEffect(() => {
    if (reduced) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reduced-motion sync is intentional
      setDisplay(target);
    }
  }, [reduced, target]);

  useEffect(() => {
    if (reduced) return;
    if (isInView) motionVal.set(target);
  }, [isInView, target, motionVal, reduced]);

  useEffect(() => {
    if (reduced) return;
    const unsubscribe = spring.on('change', (v) =>
      setDisplay(decimals > 0 ? parseFloat(v.toFixed(decimals)) : Math.round(v)),
    );
    return unsubscribe;
  }, [spring, reduced, decimals]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
