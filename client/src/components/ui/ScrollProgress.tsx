import { motion, useScroll, useSpring } from 'motion/react';

/**
 * Thin animated progress bar at the top of the page.
 * Shows scroll progress with a gradient accent color.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[100] origin-left bg-gradient-to-r from-[hsl(var(--accent))] via-[hsl(var(--primary))] to-[hsl(var(--accent))]"
      style={{ scaleX }}
    />
  );
}
