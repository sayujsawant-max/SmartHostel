import { lazy, Suspense, Component, useState, useEffect } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from '@components/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { MotionCard } from '@/components/motion/MotionCard';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion } from 'motion/react';
import { transition } from '@/utils/motion';
import { GlowingEffect } from '@components/ui/glowing-effect';
import {
  QrCode,
  Calendar,
  Wrench,
  Bell,
  UtensilsCrossed,
  Settings,
  Users,
  ArrowLeftRight,
  FileText,
  BarChart3,
  Moon,
  Search,
  ArrowRight,
} from 'lucide-react';

/* ─── 3D scene (lazy + error boundary) ──────────────────────────── */

const FloatingScene = lazy(() => import('@components/ui/FloatingScene'));
const ParallaxSection = lazy(() => import('@components/ui/parallax-scrolling'));

const MOBILE_BREAKPOINT = 768;

/** Static gradient used as fallback for loading, error, and mobile */
const SceneFallback = (
  <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--accent)/0.06)] via-transparent to-[hsl(var(--accent)/0.03)]" />
);

/** Static fallback for the parallax bridge (mobile / loading / reduced-motion) */
function ParallaxFallback() {
  return (
    <section className="relative overflow-hidden bg-[hsl(var(--background))]" style={{ height: '50vh' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[hsl(var(--accent)/0.04)] to-[hsl(var(--muted))]/25" />
      <div className="absolute top-[15%] left-[10%] w-24 h-24 rounded-full bg-[hsl(var(--accent))]/8 blur-2xl" />
      <div className="absolute top-[30%] right-[15%] w-32 h-32 rounded-full bg-purple-500/6 blur-2xl" />
      <div className="absolute bottom-[20%] left-[40%] w-20 h-20 rounded-full bg-blue-500/6 blur-2xl" />
      <div className="relative h-full flex flex-col items-center justify-center px-4 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase text-[hsl(var(--accent))] mb-3">
          Why SmartHostel
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[hsl(var(--foreground))] tracking-tight max-w-lg">
          Built for Every Resident
        </h2>
        <p className="mt-3 text-base text-[hsl(var(--muted-foreground))] max-w-md">
          A seamless digital experience for students, wardens, guards, and
          maintenance staff — all under one roof.
        </p>
      </div>
    </section>
  );
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= MOBILE_BREAKPOINT,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px)`);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return isDesktop;
}

class SceneErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('3D scene failed to load:', error, info);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

/* ─── Data ──────────────────────────────────────────────────────── */

const features = [
  { title: 'QR Gate Pass', desc: 'Generate QR codes for approved leaves. Guards scan to verify and log entry/exit instantly.', icon: QrCode },
  { title: 'Leave Management', desc: 'Request day outings or overnight leaves. Wardens approve with one click. Full audit trail.', icon: Calendar },
  { title: 'Complaint Tracking', desc: 'Report maintenance issues with priority levels. SLA tracking ensures timely resolution.', icon: Wrench },
  { title: 'Emergency SOS', desc: 'One-tap panic button for students. Warden dashboard shows live alerts with instant acknowledgment.', icon: Bell },
  { title: 'Mess Menu & Ratings', desc: 'Weekly menu at a glance. Rate meals with thumbs up/down. Wardens manage menus easily.', icon: UtensilsCrossed },
  { title: 'Laundry Booking', desc: 'Book washing machine slots online. Real-time availability grid. No more waiting in line.', icon: Settings },
  { title: 'Visitor Management', desc: 'Pre-register visitors online. Warden approves, guard checks in/out. Complete visitor log.', icon: Users },
  { title: 'Room Change Requests', desc: 'Browse available rooms and request transfers. Automatic bed count updates on approval.', icon: ArrowLeftRight },
  { title: 'PDF Reports', desc: 'Download occupancy, complaints, fee collection, and leave summary reports as formatted PDFs.', icon: FileText },
  { title: 'Analytics Dashboard', desc: 'Real-time occupancy, complaints, fees, and activity feed. Visual charts and live metrics.', icon: BarChart3 },
  { title: 'Dark Mode', desc: 'Full dark theme support across every page. Follows system preferences or toggle manually.', icon: Moon },
  { title: 'Lost & Found', desc: 'Community board for lost and found items. Claim items, track returns, help fellow residents.', icon: Search },
];

const roles = [
  { name: 'Student', desc: 'Manage leaves, complaints, meals, laundry, visitors, and more', color: 'from-blue-500 to-blue-600' },
  { name: 'Warden', desc: 'Full dashboard with analytics, approvals, reports, and student oversight', color: 'from-purple-500 to-purple-600' },
  { name: 'Guard', desc: 'QR scanning, gate pass verification, and visitor check-in/out', color: 'from-emerald-500 to-emerald-600' },
  { name: 'Maintenance', desc: 'Task management, repair history, and work order tracking', color: 'from-amber-500 to-amber-600' },
];

const stats = [
  { value: 20, label: 'Features', suffix: '+' },
  { value: 4, label: 'User Roles', suffix: '' },
  { value: 30, label: 'API Endpoints', suffix: '+' },
  { value: 100, label: 'Dark Mode', suffix: '%' },
];

const techStack = [
  'React 19', 'TypeScript 5', 'Vite 7', 'Tailwind CSS 4',
  'Express 5', 'MongoDB', 'Mongoose 9', 'JWT Auth',
  'Zod Validation', 'Swagger API Docs',
];

const demoAccounts = [
  { role: 'Student', email: 'student@smarthostel.dev' },
  { role: 'Warden', email: 'warden@smarthostel.dev' },
  { role: 'Guard', email: 'guard@smarthostel.dev' },
  { role: 'Maintenance', email: 'maintenance@smarthostel.dev' },
];

/* ─── Component ─────────────────────────────────────────────────── */

export default function LandingPage() {
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] overflow-hidden">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={transition.normal}
        className="sticky top-0 z-50 backdrop-blur-xl bg-[hsl(var(--background))]/80 border-b border-[hsl(var(--border))]/60"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent))]/80 flex items-center justify-center shadow-sm">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="text-xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              SmartHostel
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              to="/login"
              className="text-sm font-medium text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {isDesktop ? (
          <SceneErrorBoundary fallback={SceneFallback}>
            <Suspense fallback={SceneFallback}>
              <FloatingScene />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          SceneFallback
        )}

        {/* Gradient overlay to keep text readable over 3D scene */}
        <div className="absolute inset-0 bg-gradient-to-b from-[hsl(var(--background))]/40 via-transparent to-[hsl(var(--background))]/70 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-28 text-center">
          {/* Badge */}
          <Reveal direction="none" delay={0.05}>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[hsl(var(--accent)/0.08)] border border-[hsl(var(--accent)/0.15)] text-[hsl(var(--accent))] text-sm font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] animate-pulse" />
              Smart Hostel Management System
            </div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={0.12}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[hsl(var(--foreground))] leading-[1.1] tracking-tight">
              Hostel Management,
              <br />
              <span className="text-[hsl(var(--accent))]">
                Reimagined.
              </span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={0.22}>
            <p className="mt-6 text-lg sm:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto leading-relaxed">
              A complete digital ecosystem for modern hostels. From QR gate passes to
              laundry booking, emergency SOS to PDF reports &mdash; everything your
              hostel needs in one platform.
            </p>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={0.32}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--accent))]/20"
              >
                Start Free
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/rooms"
                className="inline-flex items-center w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60 transition-colors"
              >
                Browse Rooms
              </Link>
            </div>
          </Reveal>

          {/* Stats strip */}
          <Reveal delay={0.4}>
            <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="py-4 px-3 rounded-xl bg-[hsl(var(--card))]/60 backdrop-blur-sm border border-[hsl(var(--border))]/50 text-center"
                >
                  <div className="text-3xl font-bold text-[hsl(var(--foreground))]">
                    <AnimatedCounter to={s.value} suffix={s.suffix} />
                  </div>
                  <div className="text-sm text-[hsl(var(--muted-foreground))] mt-1 font-medium">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Parallax bridge ──────────────────────────────────────── */}
      {isDesktop ? (
        <Suspense fallback={<ParallaxFallback />}>
          <ParallaxSection />
        </Suspense>
      ) : (
        <ParallaxFallback />
      )}

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="py-24 bg-[hsl(var(--muted))]/25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-[hsl(var(--accent))] mb-3">
              Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              A comprehensive suite of tools for students, wardens, guards, and
              maintenance staff.
            </p>
          </Reveal>

          <StaggerContainer
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5"
            stagger={0.05}
          >
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <li className="min-h-[12rem] list-none">
                  <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-[hsl(var(--border))] p-2">
                    <GlowingEffect
                      spread={40}
                      glow
                      disabled={false}
                      proximity={64}
                      inactiveZone={0.01}
                      borderWidth={3}
                    />
                    <div className="relative flex h-full flex-col justify-between gap-4 overflow-hidden rounded-xl border-[0.75px] border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)]">
                      <div className="flex flex-1 flex-col justify-between gap-3">
                        <div className="w-fit rounded-lg border-[0.75px] border-[hsl(var(--border))] bg-[hsl(var(--muted))] p-2">
                          <f.icon className="h-4 w-4 text-[hsl(var(--foreground))]" />
                        </div>
                        <div className="space-y-2">
                          <h3 className="text-lg font-semibold leading-tight tracking-tight text-[hsl(var(--foreground))]">
                            {f.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                            {f.desc}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Roles ───────────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-[hsl(var(--accent))] mb-3">
              Role-Based Access
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              Four Roles, One Platform
            </h2>
            <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))]">
              Tailored experiences for every user type.
            </p>
          </Reveal>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" stagger={0.08}>
            {roles.map((r) => (
              <StaggerItem key={r.name}>
                <MotionCard className="h-full">
                  <div className="p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center h-full hover:shadow-md transition-shadow">
                    <div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${r.color} mx-auto flex items-center justify-center text-white text-xl font-bold shadow-sm`}
                    >
                      {r.name[0]}
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--foreground))]">
                      {r.name}
                    </h3>
                    <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                </MotionCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Tech Stack ──────────────────────────────────────────── */}
      <section className="py-24 bg-[hsl(var(--muted))]/25">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase text-[hsl(var(--accent))] mb-3">
              Tech Stack
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              Built With Modern Tech
            </h2>
          </Reveal>

          <StaggerContainer
            className="flex flex-wrap items-center justify-center gap-3"
            stagger={0.03}
          >
            {techStack.map((tech) => (
              <StaggerItem key={tech}>
                <span className="inline-block px-4 py-2 rounded-full bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-sm font-medium text-[hsl(var(--foreground))] hover:border-[hsl(var(--accent))]/40 transition-colors cursor-default">
                  {tech}
                </span>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              Ready to Get Started?
            </h2>
            <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))]">
              Sign up as a student or log in with one of the demo accounts to
              explore all features.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-10 p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-left max-w-md mx-auto shadow-sm">
              <h3 className="font-semibold text-[hsl(var(--foreground))] mb-4 text-base">
                Demo Accounts
              </h3>
              <div className="space-y-2.5 text-sm">
                {demoAccounts.map((d) => (
                  <div
                    key={d.role}
                    className="flex items-center justify-between py-1.5 border-b border-[hsl(var(--border))]/60 last:border-0"
                  >
                    <span className="font-medium text-[hsl(var(--foreground))]">
                      {d.role}
                    </span>
                    <code className="text-xs text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] px-2 py-0.5 rounded font-mono">
                      {d.email}
                    </code>
                  </div>
                ))}
                <p className="text-xs text-[hsl(var(--muted-foreground))] pt-2">
                  Password for all:{' '}
                  <code className="bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded font-mono">
                    password123
                  </code>
                </p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] hover:opacity-90 transition-opacity shadow-lg shadow-[hsl(var(--accent))]/20"
              >
                Create Account
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center w-full sm:w-auto px-8 py-3.5 rounded-xl text-base font-semibold border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/60 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-[hsl(var(--border))]/60 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            SmartHostel &mdash; Smart Hostel Management System
          </p>
          <div className="flex items-center gap-5 text-sm text-[hsl(var(--muted-foreground))]">
            <Link to="/rooms" className="hover:text-[hsl(var(--foreground))] transition-colors">
              Rooms
            </Link>
            <Link to="/login" className="hover:text-[hsl(var(--foreground))] transition-colors">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-[hsl(var(--foreground))] transition-colors">
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
