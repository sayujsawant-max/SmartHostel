import { useRef, useEffect, useState } from 'react';
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { prefersReducedMotion } from '@/utils/motion';

interface AnimatedCounterProps {
  to: number;
  className?: string;
  prefix?: string;
  suffix?: string;
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
  className,
  prefix = '',
  suffix = '',
  duration = 1.5,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  const reduced = prefersReducedMotion();
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000 });
  const [display, setDisplay] = useState(reduced ? to : 0);

  useEffect(() => {
    if (reduced) return;
    if (isInView) motionVal.set(to);
  }, [isInView, to, motionVal, reduced]);

  useEffect(() => {
    if (reduced) return;
    const unsubscribe = spring.on('change', (v) => setDisplay(Math.round(v)));
    return unsubscribe;
  }, [spring, reduced]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  );
}
