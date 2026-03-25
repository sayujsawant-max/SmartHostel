import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@smarthostel/shared';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import FormField from '@components/ui/FormField';
import Spinner from '@components/ui/Spinner';
import ThemeToggle from '@components/ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';
import { usePageTitle } from '@hooks/usePageTitle';
import { Mail, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';

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

export default function ForgotPasswordPage() {
  usePageTitle('Forgot Password');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onBlur',
  });

  async function onSubmit(data: ForgotPasswordInput) {
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/forgot-password', {
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

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row"
      style={{ '--accent': '173 80% 40%', '--ring': '173 80% 40%' } as React.CSSProperties}
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
                    Check your inbox
                  </h2>
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    If an account exists with that email, a reset link has been sent. Check your inbox.
                  </p>
                  <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                    In development mode, check the server console for the reset link.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-[hsl(var(--accent))] hover:underline font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Sign In
                  </Link>
                </motion.div>
              </motion.div>
            ) : (
              /* ── Form state ── */
              <motion.div key="form" exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}>
                {/* Heading */}
                <motion.div variants={itemVariants}>
                  <div className="w-12 h-12 rounded-xl bg-[hsl(var(--accent))]/10 flex items-center justify-center mb-4">
                    <KeyRound className="w-6 h-6 text-[hsl(var(--accent))]" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight">
                    Forgot password?
                  </h1>
                  <p className="mt-2 text-[hsl(var(--muted-foreground))] text-sm">
                    No worries, we&apos;ll send you a reset link to your email address.
                  </p>
                </motion.div>

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
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
                          <Mail className="w-4 h-4" />
                          Send Reset Link
                        </>
                      )}
                    </motion.button>
                  </motion.div>

                  {/* Back to login */}
                  <motion.div variants={itemVariants} className="text-center">
                    <Link
                      to="/login"
                      className="inline-flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent))] transition-colors font-medium group"
                    >
                      <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
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
          background: 'linear-gradient(135deg, #0f172a 0%, #042f2e 50%, #0f172a 100%)',
        }}
        initial="hidden"
        animate="visible"
        variants={rightStagger}
      >
        {/* Decorative orbs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-teal-500/15 blur-[100px]"
            animate={{ x: [0, 20, -10, 0], y: [0, -15, 10, 0], scale: [1, 1.08, 0.95, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-cyan-500/10 blur-[100px]"
            animate={{ x: [0, -15, 15, 0], y: [0, 20, -10, 0] }}
            transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute top-2/3 left-1/2 w-48 h-48 rounded-full bg-emerald-500/10 blur-[80px]"
            animate={{ x: [0, 10, -20, 0], y: [0, -20, 5, 0] }}
            transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="relative z-10 max-w-lg px-12">
          <motion.h2
            variants={rightItem}
            className="text-4xl xl:text-5xl font-bold text-white leading-tight tracking-tight"
          >
            Secure account recovery
          </motion.h2>

          <motion.p variants={rightItem} className="mt-5 text-teal-200/80 text-lg leading-relaxed">
            We take your security seriously. A password reset link will be sent to your registered email address.
          </motion.p>

          <motion.div variants={rightStagger} className="mt-10 space-y-5">
            {[
              'Secure token-based verification',
              'Time-limited reset links',
              'Instant email delivery',
              'No account data exposed',
            ].map((text) => (
              <motion.div
                key={text}
                variants={rightItem}
                className="flex items-center gap-3 group"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full bg-teal-400 shadow-lg shadow-teal-400/40 group-hover:scale-125 transition-transform" />
                <span className="text-white/90 text-base font-medium">{text}</span>
              </motion.div>
            ))}
          </motion.div>

          {/* Decorative card */}
          <motion.div
            variants={rightItem}
            className="mt-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/30"
          >
            <div className="aspect-[16/10] bg-gradient-to-br from-teal-900/50 to-cyan-900/50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mx-auto mb-3 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-white" />
                </div>
                <p className="text-white/60 text-sm font-medium">Password Recovery</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
