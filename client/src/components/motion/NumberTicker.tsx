import { useRef, useEffect, useState } from 'react';
import { useInView, useSpring, useMotionValue } from 'motion/react';

interface NumberTickerProps {
  value: number;
  className?: string;
  /** Number of decimal places */
  decimals?: number;
  /** Text before the number */
  prefix?: string;
  /** Text after the number */
  suffix?: string;
  /** Duration in seconds */
  duration?: number;
  /** Delay before starting */
  delay?: number;
  /** Direction to count from */
  direction?: 'up' | 'down';
}

/**
 * Premium number ticker with spring physics.
 * Counts up/down when scrolled into view with configurable precision.
 */
export function NumberTicker({
  value,
  className,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 2,
  delay = 0,
  direction = 'up',
}: NumberTickerProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const motionVal = useMotionValue(direction === 'up' ? 0 : value);
  const spring = useSpring(motionVal, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000,
  });
  const [display, setDisplay] = useState(direction === 'up' ? 0 : value);

  useEffect(() => {
    if (isInView) {
      const timer = setTimeout(() => {
        motionVal.set(direction === 'up' ? value : 0);
      }, delay * 1000);
      return () => clearTimeout(timer);
    }
  }, [isInView, value, delay, direction, motionVal]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => {
      setDisplay(parseFloat(v.toFixed(decimals)));
    });
    return unsubscribe;
  }, [spring, decimals]);

  return (
    <span ref={ref} className={`tabular-nums ${className || ''}`}>
      {prefix}
      {display.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
