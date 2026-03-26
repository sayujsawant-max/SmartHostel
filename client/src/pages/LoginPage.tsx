import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ApiError } from '@services/api';
import { getRoleHomePath } from '@utils/role-home';
import FormField from '@components/ui/FormField';
import Spinner from '@components/ui/Spinner';
import GoogleSignInButton from '@components/ui/GoogleSignInButton';
import ThemeToggle from '@components/ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  Users,
  Shield,
  ShieldCheck,
  Wrench,
  ArrowRight,
  QrCode,
  Clock,
  MessageSquare,
  Wifi,
  Eye,
  EyeOff,
} from 'lucide-react';

/* ─── Role card data ──────────────────────────────────────────── */

const ROLES = [
  { key: 'STUDENT', label: 'Student', icon: Users },
  { key: 'WARDEN', label: 'Warden', icon: Shield },
  { key: 'GUARD', label: 'Guard', icon: ShieldCheck },
  { key: 'MAINTENANCE', label: 'Maintenance', icon: Wrench },
] as const;

const RIGHT_FEATURES = [
  { icon: QrCode, text: 'Secure QR-based gate access' },
  { icon: Clock, text: 'Instant leave approval system' },
  { icon: MessageSquare, text: 'Real-time complaint tracking' },
  { icon: Wifi, text: '24/7 platform availability' },
];

/* ─── Animation variants ──────────────────────────────────────── */

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.15 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const rightStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.3 },
  },
};

const rightItem = {
  hidden: { opacity: 0, x: 30, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/* ─── Component ───────────────────────────────────────────────── */

export default function LoginPage() {
  usePageTitle('Login');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutMs, setLockoutMs] = useState<number>(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [selectedRole, setSelectedRole] = useState('STUDENT');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
  });

  const clearLockoutTimer = useCallback(() => {
    if (lockoutTimerRef.current) {
      clearInterval(lockoutTimerRef.current);
      lockoutTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return clearLockoutTimer;
  }, [clearLockoutTimer]);

  function startLockoutCountdown(durationMs: number) {
    clearLockoutTimer();
    const endTime = Date.now() + durationMs;
    setLockoutMs(durationMs);

    lockoutTimerRef.current = setInterval(() => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        setLockoutMs(0);
        clearLockoutTimer();
      } else {
        setLockoutMs(remaining);
      }
    }, 1000);
  }

  async function onSubmit(data: LoginInput) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const loggedInUser = await login(data.email, data.password);
      navigate(getRoleHomePath(loggedInUser.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'RATE_LIMITED' && err.retryAfterMs) {
          startLockoutCountdown(err.retryAfterMs);
          setServerError('Account temporarily locked due to too many failed attempts.');
        } else {
          setServerError(err.message);
        }
      } else {
        setServerError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const isLocked = lockoutMs > 0;
  const lockoutSeconds = Math.ceil(lockoutMs / 1000);

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ '--accent': '239 84% 67%', '--ring': '239 84% 67%' } as React.CSSProperties}
    >
      {/* ── Left: Form ──────────────────────────────────────────── */}
      <motion.div
        className="flex-1 flex items-center justify-center px-6 py-10 lg:py-0 bg-[hsl(var(--background))] dark:bg-slate-900 relative"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Theme toggle */}
        <motion.div
          className="absolute top-4 right-4 lg:top-6 lg:right-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <ThemeToggle />
        </motion.div>

        <div className="w-full max-w-md">
          {/* Heading */}
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight gradient-heading">
              Welcome back
            </h1>
            <p className="mt-2 text-[hsl(var(--muted-foreground))] text-sm">
              Sign in to continue to your account
            </p>
          </motion.div>

          {/* Role selector */}
          <motion.div variants={itemVariants} className="mt-8">
            <p className="text-sm font-medium text-[hsl(var(--foreground))] mb-3">Select Your Role</p>
            <div className="grid grid-cols-2 gap-3">
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.key;
                const Icon = role.icon;
                return (
                  <motion.button
                    key={role.key}
                    type="button"
                    onClick={() => setSelectedRole(role.key)}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border-2 px-4 py-4 transition-colors card-shine ${
                      isSelected
                        ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5 breathe-glow'
                        : 'border-[hsl(var(--border))] bg-[hsl(var(--background))] hover:border-[hsl(var(--accent))]/40'
                    }`}
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    transition={spring}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="role-indicator"
                        className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[hsl(var(--accent))]"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected
                          ? 'text-[hsl(var(--accent))]'
                          : 'text-[hsl(var(--muted-foreground))]'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium ${
                        isSelected
                          ? 'text-[hsl(var(--accent))]'
                          : 'text-[hsl(var(--foreground))]'
                      }`}
                    >
                      {role.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <motion.div variants={itemVariants}>
              <FormField
                label="Email Address"
                id="email"
                error={errors.email?.message}
                inputProps={{
                  ...register('email'),
                  type: 'email',
                  autoComplete: 'email',
                  placeholder: 'you@example.com',
                }}
              />
            </motion.div>

            <motion.div variants={itemVariants}>
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-[hsl(var(--foreground))]"
                  >
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs text-[hsl(var(--accent))] hover:underline font-medium"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] focus:border-transparent transition-shadow"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                    tabIndex={-1}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={showPassword ? 'eye-off' : 'eye'}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.15 }}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4.5 h-4.5" />
                        ) : (
                          <Eye className="w-4.5 h-4.5" />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </button>
                </div>
                {errors.password?.message && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Server error */}
            <AnimatePresence>
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-[hsl(var(--destructive))] text-center"
                >
                  <p>{serverError}</p>
                  {isLocked && (
                    <p className="mt-1 font-medium">
                      Try again in {lockoutSeconds} second{lockoutSeconds !== 1 ? 's' : ''}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit button */}
            <motion.div variants={itemVariants}>
              <motion.button
                type="submit"
                disabled={isSubmitting || isLocked}
                className="group w-full min-h-[48px] rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-[hsl(var(--accent))]/20 magnetic-hover"
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                {isSubmitting ? (
                  <Spinner />
                ) : isLocked ? (
                  `Locked (${lockoutSeconds}s)`
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>
            </motion.div>

            <GoogleSignInButton onError={(msg) => setServerError(msg)} />

            {/* Divider */}
            <motion.div variants={itemVariants} className="relative flex items-center">
              <div className="flex-1 border-t border-[hsl(var(--border))]" />
              <span className="px-3 text-xs text-[hsl(var(--muted-foreground))]">
                Don&apos;t have an account?
              </span>
              <div className="flex-1 border-t border-[hsl(var(--border))]" />
            </motion.div>

            {/* Register link */}
            <motion.div variants={itemVariants}>
              <motion.div
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
              >
                <Link
                  to="/register"
                  className="w-full min-h-[48px] rounded-xl border-2 border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium flex items-center justify-center hover:border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/5 transition-colors"
                >
                  Create an account
                </Link>
              </motion.div>
            </motion.div>

            {/* Browse rooms link */}
            <motion.div variants={itemVariants} className="text-center">
              <Link
                to="/rooms"
                className="inline-flex items-center gap-1 text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent))] transition-colors group"
              >
                Browse available rooms without signing in
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          </form>
        </div>
      </motion.div>

      {/* ── Right: Info panel ────────────────────────────────────── */}
      <motion.div
        className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
        }}
        initial="hidden"
        animate="visible"
        variants={rightStagger}
      >
        {/* Decorative orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-indigo-600/15 blur-[100px]"
            animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0], scale: [1, 1.08, 0.95, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-600/10 blur-[100px]"
            animate={{ x: [0, -15, 15, 0], y: [0, 20, -10, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 max-w-lg px-12">
          <motion.h2
            variants={rightItem}
            className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight"
          >
            Your complete hostel management solution
          </motion.h2>

          <motion.p variants={rightItem} className="mt-5 text-indigo-200/80 text-lg leading-relaxed">
            Access everything from QR gate passes to leave requests, all in one secure platform.
          </motion.p>

          <motion.div variants={rightStagger} className="mt-10 space-y-5">
            {RIGHT_FEATURES.map((f) => (
              <motion.div
                key={f.text}
                variants={rightItem}
                className="flex items-center gap-3 group"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/40 group-hover:scale-125 transition-transform" />
                <span className="text-white/90 text-base font-medium">{f.text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Decorative image placeholder */}
          <motion.div
            variants={rightItem}
            className="mt-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/30"
          >
            <div className="aspect-[16/10] bg-gradient-to-br from-indigo-900/50 to-purple-900/50 morph-gradient flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mx-auto mb-3 flex items-center justify-center breathe-glow">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                </div>
                <p className="text-white/60 text-sm font-medium">SmartHostel</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
