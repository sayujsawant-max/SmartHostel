import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { prefersReducedMotion } from '@/utils/motion';

interface AnimatedGradientBorderProps {
  children: ReactNode;
  className?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Animation duration in seconds */
  duration?: number;
  /** Gradient colors */
  colors?: string[];
  /** Border radius class */
  rounded?: string;
}

/**
 * A card wrapper with an animated gradient border that rotates around the element.
 */
export function AnimatedGradientBorder({
  children,
  className = '',
  borderWidth = 1,
  duration = 4,
  colors,
  rounded = 'rounded-2xl',
}: AnimatedGradientBorderProps) {
  const gradientColors = colors || [
    'hsl(var(--accent))',
    'hsl(222 47% 55%)',
    'hsl(var(--accent))',
    'hsl(173 78% 40%)',
    'hsl(var(--accent))',
  ];

  if (prefersReducedMotion()) {
    return (
      <div className={`${rounded} border border-[hsl(var(--border))] ${className}`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`relative ${rounded} p-[${borderWidth}px] ${className}`}>
      <motion.div
        className={`absolute inset-0 ${rounded}`}
        style={{
          background: `conic-gradient(from 0deg, ${gradientColors.join(', ')})`,
          padding: borderWidth,
          maskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskImage: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      <div className={`relative ${rounded} bg-[hsl(var(--card))]`}>
        {children}
      </div>
    </div>
  );
}
