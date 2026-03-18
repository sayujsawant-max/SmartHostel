import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/utils/motion';

/**
 * ParallaxSection — a scroll-driven visual bridge between Hero and Features.
 *
 * Desktop: 4 abstract geometric layers move at different parallax speeds
 * via GSAP ScrollTrigger, with a centered headline.
 *
 * Mobile / reduced-motion: renders a static fallback (no GSAP loaded).
 *
 * This component should be lazy-loaded so GSAP only downloads on LandingPage.
 */

/* ─── Shape layers (CSS gradients + inline SVG) ─────────────────── */

function ShapeLayer({
  className,
  children,
}: {
  className: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`absolute pointer-events-none will-change-transform ${className}`}
    >
      {children}
    </div>
  );
}

/* ─── Main parallax component (desktop only) ─────────────────────── */

export default function ParallaxSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Bail out if reduced motion is preferred
    if (prefersReducedMotion()) return;

    let ctx: { revert: () => void } | null = null;

    // Dynamic import — GSAP is only loaded when this effect runs (desktop)
    void (async () => {
      const gsapModule = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');

      const gsap = gsapModule.default ?? gsapModule.gsap ?? gsapModule;
      gsap.registerPlugin(ScrollTrigger);

      if (!containerRef.current) return;

      // GSAP context for clean teardown
      ctx = gsap.context(() => {
        const layers = layersRef.current.filter(Boolean) as HTMLDivElement[];

        // Each layer moves at a different speed relative to scroll.
        // Positive = moves down slower (appears to recede),
        // negative = moves down faster (appears closer).
        // Keep travel modest to avoid clipping at edges.
        const speeds = [50, -35, 55, -25]; // px of parallax travel

        layers.forEach((layer, i) => {
          gsap.fromTo(
            layer,
            { y: -speeds[i] },
            {
              y: speeds[i],
              ease: 'none',
              scrollTrigger: {
                trigger: containerRef.current,
                start: 'top bottom',
                end: 'bottom top',
                scrub: 0.6, // slight smoothing for premium feel with Lenis
              },
            },
          );
        });
      }, containerRef);
    })();

    return () => {
      ctx?.revert();
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-[hsl(var(--background))]"
      style={{ height: '70vh' }}
    >
      {/* Gradient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--accent)/0.04)] to-[hsl(var(--muted))]/25" />

      {/* Layer 1 — large teal ring (top-left) */}
      <ShapeLayer className="top-[8%] left-[5%] w-56 h-56">
        <div
          ref={(el) => { layersRef.current[0] = el; }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.12]">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="hsl(var(--accent))"
              strokeWidth="6"
            />
          </svg>
        </div>
      </ShapeLayer>

      {/* Layer 2 — purple soft blob (right) */}
      <ShapeLayer className="top-[20%] right-[8%] w-48 h-48">
        <div
          ref={(el) => { layersRef.current[1] = el; }}
          className="w-full h-full rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(167,139,250,0.15) 0%, rgba(167,139,250,0) 70%)',
          }}
        />
      </ShapeLayer>

      {/* Layer 3 — blue hexagon (bottom-left) */}
      <ShapeLayer className="bottom-[18%] left-[20%] w-40 h-40">
        <div
          ref={(el) => { layersRef.current[2] = el; }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.10]">
            <polygon
              points="100,10 190,55 190,145 100,190 10,145 10,55"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="5"
            />
          </svg>
        </div>
      </ShapeLayer>

      {/* Layer 4 — pink diamond (top-right area) */}
      <ShapeLayer className="top-[55%] right-[25%] w-28 h-28">
        <div
          ref={(el) => { layersRef.current[3] = el; }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-[0.10]">
            <rect
              x="15"
              y="15"
              width="70"
              height="70"
              rx="4"
              fill="none"
              stroke="#f472b6"
              strokeWidth="4"
              transform="rotate(45 50 50)"
            />
          </svg>
        </div>
      </ShapeLayer>

      {/* Centered text content */}
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center z-10">
        <p className="text-sm font-semibold tracking-widest uppercase text-[hsl(var(--accent))] mb-3">
          Why SmartHostel
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight max-w-lg">
          Built for Every Resident
        </h2>
        <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-md leading-relaxed">
          A seamless digital experience for students, wardens, guards, and
          maintenance staff — all under one roof.
        </p>
      </div>
    </section>
  );
}
