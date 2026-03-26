import { useRef, type ReactNode } from 'react';
import { motion, useInView } from 'motion/react';
import { prefersReducedMotion } from '@/utils/motion';

interface TextRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  /** Split and animate by 'word' or 'char' */
  by?: 'word' | 'char';
}

/**
 * Reveals text word-by-word or character-by-character with a staggered blur-up effect.
 */
export function TextReveal({
  children,
  className,
  delay = 0,
  by = 'word',
}: TextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px 0px' });

  if (prefersReducedMotion()) {
    return <span className={className}>{children}</span>;
  }

  const text = typeof children === 'string' ? children : '';
  if (!text) return <span className={className}>{children}</span>;

  const parts = by === 'word' ? text.split(' ') : text.split('');

  return (
    <span ref={ref} className={className} aria-label={text}>
      {parts.map((part, i) => (
        <motion.span
          key={`${part}-${i}`}
          initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
          animate={
            isInView
              ? { opacity: 1, y: 0, filter: 'blur(0px)' }
              : { opacity: 0, y: 12, filter: 'blur(4px)' }
          }
          transition={{
            duration: 0.35,
            delay: delay + i * (by === 'word' ? 0.08 : 0.03),
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ display: 'inline-block', whiteSpace: 'pre' }}
          aria-hidden
        >
          {part}{by === 'word' && i < parts.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  );
}
