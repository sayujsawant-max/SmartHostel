import { Link } from 'react-router-dom';
import ThemeToggle from '@components/ThemeToggle';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import { MotionCard } from '@/components/motion/MotionCard';
import { AnimatedCounter } from '@/components/motion/AnimatedCounter';
import { motion, useScroll, useTransform } from 'motion/react';
import { transition } from '@/utils/motion';
import {
  QrCode,
  Calendar,
  Wrench,
  Bell,
  Users,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useRef } from 'react';
import AnimatedShaderHero from '@components/ui/animated-shader-hero';

/* ─── Floating stat card wrapper ───────────────────────────────── */

function FloatingCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Data ──────────────────────────────────────────────────────── */

const features = [
  {
    title: 'QR Gate Pass System',
    desc: 'Secure, contactless entry with real-time verification and automated parent notifications',
    icon: QrCode,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    title: 'Digital Leave Management',
    desc: 'Request, approve, and track leave applications with instant approvals and status updates',
    icon: Calendar,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    title: 'Complaint Tracking',
    desc: 'Report and monitor maintenance issues with priority-based resolution and real-time updates',
    icon: Wrench,
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    title: 'Multi-Role Access',
    desc: 'Dedicated portals for students, wardens, guards, and maintenance staff with role-based permissions',
    icon: Users,
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    title: 'Smart Notifications',
    desc: 'Instant alerts for approvals, emergencies, and important updates via push and email',
    icon: Bell,
    iconBg: 'bg-sky-100 dark:bg-sky-900/40',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    title: '24/7 Availability',
    desc: 'Access all features anytime, anywhere with our cloud-based platform',
    icon: Clock,
    iconBg: 'bg-pink-100 dark:bg-pink-900/40',
    iconColor: 'text-pink-600 dark:text-pink-400',
  },
];

const stats = [
  { value: 500, label: 'Students Managed', suffix: '+' },
  { value: 50, label: 'Available Rooms', suffix: '+' },
  { value: 4, label: 'User Roles', suffix: '' },
  { value: 99.9, label: 'Uptime', suffix: '%' },
];

const whyChooseUs = [
  'Automated leave approval workflow',
  'QR-based secure gate access',
  'Real-time complaint tracking',
  'Student self-registration',
  'Warden admin dashboard',
  'Guard scanning interface',
];

const demoAccounts = [
  { role: 'Student', email: 'student@smarthostel.dev' },
  { role: 'Warden', email: 'warden@smarthostel.dev' },
  { role: 'Guard', email: 'guard@smarthostel.dev' },
  { role: 'Maintenance', email: 'maintenance@smarthostel.dev' },
];

/* ─── Component ─────────────────────────────────────────────────── */

export default function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroTextY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] overflow-hidden">
      {/* ── Nav ─────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={transition.normal}
        className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/90 border-b border-white/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/landing" className="flex items-center gap-2.5 group">
            <motion.div
              className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25"
              whileHover={{ scale: 1.1, rotate: -5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </motion.div>
            <span className="text-xl font-bold text-white tracking-tight">
              SmartHostel
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
            >
              <Link
                to="/register"
                className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25 inline-block"
              >
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <AnimatedShaderHero>
        <motion.div
          ref={heroRef}
          style={{ y: heroTextY, opacity: heroOpacity }}
          className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-20 sm:pb-28 text-center"
        >
          {/* Badge */}
          <Reveal direction="none" delay={0.05}>
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium text-slate-300 mb-8 backdrop-blur-sm"
              whileHover={{ scale: 1.04, borderColor: 'rgba(255,255,255,0.25)' }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </motion.span>
              Smart Hostel Management Platform
            </motion.div>
          </Reveal>

          {/* Headline */}
          <Reveal delay={0.12}>
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
              <span className="text-white">Modern Hostel</span>
              <br />
              <motion.span
                className="bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent bg-[length:200%_auto]"
                animate={{ backgroundPosition: ['0% center', '100% center', '0% center'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                Management Simplified
              </motion.span>
            </h1>
          </Reveal>

          {/* Subtitle */}
          <Reveal delay={0.22}>
            <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Complete digital ecosystem for hostels. QR gate passes, leave management,
              complaint tracking, and more &mdash; all in one premium platform.
            </p>
          </Reveal>

          {/* CTA Buttons */}
          <Reveal delay={0.32}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-xl shadow-white/10"
                >
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  to="/rooms"
                  className="inline-flex items-center w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold border border-white/20 text-white hover:bg-white/5 transition-colors backdrop-blur-sm"
                >
                  Browse Rooms
                </Link>
              </motion.div>
            </div>
          </Reveal>

          {/* Stats strip */}
          <Reveal delay={0.45}>
            <div className="mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {stats.map((s, i) => (
                <FloatingCard key={s.label} delay={i * 0.5}>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                      <AnimatedCounter to={s.value} suffix={s.suffix} />
                    </div>
                    <div className="text-sm text-slate-500 mt-1 font-medium">
                      {s.label}
                    </div>
                  </div>
                </FloatingCard>
              ))}
            </div>
          </Reveal>
        </motion.div>
      </AnimatedShaderHero>

      {/* ── Features ────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-[hsl(var(--background))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              Everything You Need
            </h2>
            <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
              Powerful features designed for modern hostel management
            </p>
          </Reveal>

          <StaggerContainer
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            stagger={0.08}
          >
            {features.map((f) => (
              <StaggerItem key={f.title}>
                <MotionCard className="h-full" lift={6}>
                  <motion.div
                    className="h-full p-7 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] transition-colors duration-300 group cursor-default card-glow accent-line"
                    whileHover={{
                      boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.08)',
                      borderColor: 'rgba(99, 102, 241, 0.2)',
                    }}
                    transition={{ duration: 0.25 }}
                  >
                    <motion.div
                      className={`w-12 h-12 rounded-xl ${f.iconBg} flex items-center justify-center mb-5`}
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <f.icon className={`w-6 h-6 ${f.iconColor}`} />
                    </motion.div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">
                      {f.desc}
                    </p>
                  </motion.div>
                </MotionCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Why Choose Us ───────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-[hsl(var(--muted))]/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left column */}
            <Reveal>
              <div>
                <motion.div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-6"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.span
                    animate={{ rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </motion.span>
                  Why Choose Us
                </motion.div>

                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[hsl(var(--foreground))] tracking-tight leading-tight">
                  Built for Modern Hostels
                </h2>

                <p className="mt-5 text-lg text-[hsl(var(--muted-foreground))] leading-relaxed max-w-lg">
                  SmartHostel streamlines every aspect of hostel operations, from student
                  onboarding to daily management tasks.
                </p>

                <StaggerContainer className="mt-8 space-y-4" stagger={0.08}>
                  {whyChooseUs.map((item) => (
                    <StaggerItem key={item}>
                      <motion.div
                        className="flex items-center gap-3"
                        whileHover={{ x: 6 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          whileInView={{ scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        </motion.div>
                        <span className="text-base text-[hsl(var(--foreground))]">{item}</span>
                      </motion.div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>

                <Reveal delay={0.3}>
                  <motion.div
                    className="inline-block mt-10"
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                  >
                    <Link
                      to="/register"
                      className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                      Get Started Now
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </motion.div>
                </Reveal>
              </div>
            </Reveal>

            {/* Right column — image */}
            <Reveal delay={0.15}>
              <div className="relative">
                <motion.div
                  className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 dark:shadow-black/30 border border-[hsl(var(--border))]"
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-900 flex items-center justify-center relative overflow-hidden">
                    {/* Subtle animated shimmer */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 3 }}
                    />
                    <div className="text-center px-8 relative z-10">
                      <motion.div
                        className="w-20 h-20 rounded-2xl bg-indigo-600/10 dark:bg-indigo-500/20 mx-auto flex items-center justify-center mb-4"
                        animate={{ rotate: [0, 2, -2, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <svg className="w-10 h-10 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                        </svg>
                      </motion.div>
                      <h3 className="text-xl font-bold text-[hsl(var(--foreground))]">SmartHostel</h3>
                      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Modern Hostel Management</p>
                    </div>
                  </div>
                </motion.div>

                {/* Floating card overlay */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5, type: 'spring', stiffness: 200 }}
                  className="absolute -bottom-6 -left-4 sm:left-4"
                >
                  <FloatingCard delay={1}>
                    <motion.div
                      className="bg-[hsl(var(--card))] rounded-xl p-4 shadow-xl border border-[hsl(var(--border))] flex items-center gap-3"
                      whileHover={{ scale: 1.06 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="w-11 h-11 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-[hsl(var(--foreground))]">50+</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">Available Rooms</p>
                      </div>
                    </motion.div>
                  </FloatingCard>
                </motion.div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Roles ───────────────────────────────────────────────── */}
      <section className="py-20 sm:py-28 bg-[hsl(var(--background))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-16">
            <p className="text-sm font-semibold tracking-widest uppercase text-indigo-600 dark:text-indigo-400 mb-3">
              Role-Based Access
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight">
              Four Roles, One Platform
            </h2>
            <p className="mt-4 text-lg text-[hsl(var(--muted-foreground))]">
              Tailored experiences for every user type.
            </p>
          </Reveal>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5" stagger={0.1}>
            {[
              { name: 'Student', desc: 'Manage leaves, complaints, meals, laundry, visitors, and more', color: 'from-blue-500 to-blue-600' },
              { name: 'Warden', desc: 'Full dashboard with analytics, approvals, reports, and student oversight', color: 'from-purple-500 to-purple-600' },
              { name: 'Guard', desc: 'QR scanning, gate pass verification, and visitor check-in/out', color: 'from-emerald-500 to-emerald-600' },
              { name: 'Maintenance', desc: 'Task management, repair history, and work order tracking', color: 'from-amber-500 to-amber-600' },
            ].map((r) => (
              <StaggerItem key={r.name}>
                <MotionCard className="h-full">
                  <motion.div
                    className="p-6 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center h-full transition-colors duration-300 card-glow"
                    whileHover={{
                      boxShadow: '0 20px 40px -12px rgba(99, 102, 241, 0.08)',
                      borderColor: 'rgba(99, 102, 241, 0.2)',
                    }}
                  >
                    <motion.div
                      className={`w-14 h-14 rounded-full bg-gradient-to-br ${r.color} mx-auto flex items-center justify-center text-white text-xl font-bold shadow-sm`}
                      whileHover={{ scale: 1.15, rotate: 10 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      {r.name[0]}
                    </motion.div>
                    <h3 className="mt-4 text-lg font-semibold text-[hsl(var(--foreground))]">
                      {r.name}
                    </h3>
                    <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                      {r.desc}
                    </p>
                  </motion.div>
                </MotionCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────── */}
      <section className="relative py-24 sm:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900" />
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute top-1/3 left-1/4 w-72 h-72 rounded-full bg-indigo-600/15 blur-[100px]"
            animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-600/10 blur-[100px]"
            animate={{ x: [0, -15, 10, 0], y: [0, 10, -15, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
              Ready to Get Started?
            </h2>
            <p className="mt-5 text-lg text-slate-400">
              Sign up as a student or log in with one of the demo accounts to
              explore all features.
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <motion.div
              className="mt-10 p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 text-left max-w-md mx-auto"
              whileHover={{ borderColor: 'rgba(255,255,255,0.2)' }}
              transition={{ duration: 0.2 }}
            >
              <h3 className="font-semibold text-white mb-4 text-base">
                Demo Accounts
              </h3>
              <div className="space-y-2.5 text-sm">
                {demoAccounts.map((d) => (
                  <div
                    key={d.role}
                    className="flex items-center justify-between py-1.5 border-b border-white/10 last:border-0"
                  >
                    <span className="font-medium text-white">{d.role}</span>
                    <code className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono">
                      {d.email}
                    </code>
                  </div>
                ))}
                <p className="text-xs text-slate-500 pt-2">
                  Password for all:{' '}
                  <code className="bg-white/5 px-1.5 py-0.5 rounded font-mono">
                    password123
                  </code>
                </p>
              </div>
            </motion.div>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  to="/register"
                  className="group inline-flex items-center gap-2 w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-xl shadow-white/10"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link
                  to="/login"
                  className="inline-flex items-center w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold border border-white/20 text-white hover:bg-white/5 transition-colors"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="border-t border-[hsl(var(--border))]/60 py-8 bg-[hsl(var(--background))]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              SmartHostel &mdash; Smart Hostel Management System
            </span>
          </div>
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
