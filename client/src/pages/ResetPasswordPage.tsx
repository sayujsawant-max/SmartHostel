import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { selfResetPasswordSchema, type SelfResetPasswordInput } from '@smarthostel/shared';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import Spinner from '@components/ui/Spinner';
import ThemeToggle from '@components/ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';
import { usePageTitle } from '@hooks/usePageTitle';
import { Lock, Eye, EyeOff, CheckCircle, ShieldCheck } from 'lucide-react';

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

/* ─── Password strength helper ────────────────────────────────── */

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 20, label: 'Weak', color: 'bg-red-500' };
  if (score === 2) return { score: 40, label: 'Fair', color: 'bg-orange-500' };
  if (score === 3) return { score: 60, label: 'Good', color: 'bg-yellow-500' };
  if (score === 4) return { score: 80, label: 'Strong', color: 'bg-emerald-500' };
  return { score: 100, label: 'Excellent', color: 'bg-emerald-400' };
}

/* ─── Component ───────────────────────────────────────────────── */

export default function ResetPasswordPage() {
  usePageTitle('Reset Password');
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SelfResetPasswordInput>({
    resolver: zodResolver(selfResetPasswordSchema),
    defaultValues: { token },
    mode: 'onBlur',
  });

  const passwordValue = watch('password', '');
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);
  const passwordsMatch = confirmPassword.length > 0 && passwordValue === confirmPassword;

  async function onSubmit(data: SelfResetPasswordInput) {
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setSuccess(true);
    } catch (err) {
      showError(err, 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  /* ── Missing token state ── */
  if (!token) {
    return (
      <div
        className="min-h-screen flex flex-col lg:flex-row"
        style={{ '--accent': '271 81% 56%', '--ring': '271 81% 56%' } as React.CSSProperties}
      >
        <div className="flex-1 flex items-center justify-center px-6 py-10 bg-[hsl(var(--background))] dark:bg-slate-900 relative">
          <motion.div
            className="absolute top-4 right-4 lg:top-6 lg:right-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <ThemeToggle />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="text-center space-y-6 max-w-md"
          >
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mx-auto flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
              Invalid or missing reset token
            </h2>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              The reset link may have expired or is invalid. Please request a new one.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center gap-2 text-sm text-[hsl(var(--accent))] hover:underline font-medium"
            >
              Request a new reset link
            </Link>
          </motion.div>
        </div>

        {/* Right panel */}
        <div
          className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1338 50%, #0f172a 100%)',
          }}
        >
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-purple-600/15 blur-[100px]"
              animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0], scale: [1, 1.08, 0.95, 1] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-violet-500/10 blur-[100px]"
              animate={{ x: [0, -15, 15, 0], y: [0, 20, -10, 0] }}
              transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ '--accent': '271 81% 56%', '--ring': '271 81% 56%' } as React.CSSProperties}
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
          <AnimatePresence mode="wait">
            {success ? (
              /* ── Success state ── */
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9, filter: 'blur(8px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="text-center space-y-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                  className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto flex items-center justify-center"
                >
                  <CheckCircle className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">
                    Password reset successful
                  </h2>
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    Your password has been reset successfully. You can now sign in with your new password.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    transition={spring}
                  >
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 w-full min-h-[48px] rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold justify-center shadow-lg shadow-[hsl(var(--accent))]/20"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Sign in with new password
                    </Link>
                  </motion.div>
                </motion.div>
              </motion.div>
            ) : (
              /* ── Form state ── */
              <motion.div key="form" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                {/* Heading */}
                <motion.div variants={itemVariants}>
                  <div className="w-12 h-12 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center mb-4">
                    <Lock className="w-6 h-6 text-[hsl(var(--accent))]" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight">
                    Set new password
                  </h1>
                  <p className="mt-2 text-[hsl(var(--muted-foreground))] text-sm">
                    Your new password must be different from previously used passwords.
                  </p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
                  <input type="hidden" {...register('token')} />

                  {/* New Password */}
                  <motion.div variants={itemVariants}>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1"
                    >
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
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

                    {/* Password strength indicator */}
                    {passwordValue.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">Password strength</span>
                          <span className="text-xs font-medium text-[hsl(var(--foreground))]">{strength.label}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[hsl(var(--muted))]/30 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${strength.color}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${strength.score}%` }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div variants={itemVariants}>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirm ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Re-enter your password"
                        className="w-full px-3 py-2.5 pr-10 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))] focus:border-transparent transition-shadow"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
                        tabIndex={-1}
                      >
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={showConfirm ? 'eye-off-c' : 'eye-c'}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.15 }}
                          >
                            {showConfirm ? (
                              <EyeOff className="w-4.5 h-4.5" />
                            ) : (
                              <Eye className="w-4.5 h-4.5" />
                            )}
                          </motion.div>
                        </AnimatePresence>
                      </button>
                    </div>
                    {/* Match indicator */}
                    <AnimatePresence>
                      {confirmPassword.length > 0 && (
                        <motion.p
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`mt-1 text-xs flex items-center gap-1 ${
                            passwordsMatch
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {passwordsMatch ? (
                            <>
                              <CheckCircle className="w-3 h-3" />
                              Passwords match
                            </>
                          ) : (
                            'Passwords do not match'
                          )}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Submit button */}
                  <motion.div variants={itemVariants}>
                    <motion.button
                      type="submit"
                      disabled={isSubmitting}
                      className="group w-full min-h-[48px] rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all shadow-lg shadow-[hsl(var(--accent))]/20"
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      transition={spring}
                    >
                      {isSubmitting ? (
                        <Spinner />
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Reset Password
                        </>
                      )}
                    </motion.button>
                  </motion.div>

                  {/* Back to login */}
                  <motion.div variants={itemVariants} className="text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent))] transition-colors font-medium"
                    >
                      Back to Sign In
                    </Link>
                  </motion.div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ── Right: Decorative panel ────────────────────────────────── */}
      <motion.div
        className="hidden lg:flex flex-1 relative overflow-hidden items-center justify-center"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1338 50%, #0f172a 100%)',
        }}
        initial="hidden"
        animate="visible"
        variants={rightStagger}
      >
        {/* Decorative orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-purple-600/15 blur-[100px]"
            animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0], scale: [1, 1.08, 0.95, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-violet-500/10 blur-[100px]"
            animate={{ x: [0, -15, 15, 0], y: [0, 20, -10, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-1/2 left-2/3 w-48 h-48 rounded-full bg-fuchsia-500/10 blur-[80px]"
            animate={{ x: [0, 10, -20, 0], y: [0, -20, 5, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 max-w-lg px-12">
          <motion.h2
            variants={rightItem}
            className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight"
          >
            Create a strong, secure password
          </motion.h2>

          <motion.p variants={rightItem} className="mt-5 text-purple-200/80 text-lg leading-relaxed">
            Choose a password that keeps your account safe. We recommend using a mix of characters.
          </motion.p>

          <motion.div variants={rightStagger} className="mt-10 space-y-5">
            {[
              'Use at least 8 characters',
              'Mix uppercase & lowercase letters',
              'Include numbers and symbols',
              'Avoid common words or patterns',
            ].map((text) => (
              <motion.div
                key={text}
                variants={rightItem}
                className="flex items-center gap-3 group"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-purple-400 shadow-lg shadow-purple-400/40 group-hover:scale-125 transition-transform" />
                <span className="text-white/90 text-base font-medium">{text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Decorative card */}
          <motion.div
            variants={rightItem}
            className="mt-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/30"
          >
            <div className="aspect-[16/10] bg-gradient-to-br from-purple-900/50 to-violet-900/50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mx-auto mb-3 flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
                <p className="text-white/60 text-sm font-medium">Secure Reset</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
