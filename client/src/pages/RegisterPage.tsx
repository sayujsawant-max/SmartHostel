import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ApiError } from '@services/api';
import { getRoleHomePath } from '@utils/role-home';
import FormField from '@components/ui/FormField';
import Spinner from '@components/ui/Spinner';
import GoogleSignInButton from '@components/ui/GoogleSignInButton';
import ThemeToggle from '@components/ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ArrowLeft, Check, Eye, EyeOff } from 'lucide-react';
import { usePageTitle } from '@hooks/usePageTitle';

/* ─── Step definitions ────────────────────────────────────────── */

const STEPS = [
  { num: 1, label: 'Personal Info', desc: 'Basic details and credentials' },
  { num: 2, label: 'Academic Details', desc: 'Gender and academic year' },
] as const;

/* Step 1 fields for partial validation before advancing */
const STEP_1_FIELDS: (keyof RegisterInput)[] = ['name', 'email', 'password'];

/* ─── Animation variants ──────────────────────────────────────── */

const spring = { type: 'spring' as const, stiffness: 400, damping: 25 };

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

const rightStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const rightItem = {
  hidden: { opacity: 0, x: 30, filter: 'blur(6px)' },
  visible: { opacity: 1, x: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

/* Slide direction for step transitions */
const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir > 0 ? -60 : 60,
    opacity: 0,
  }),
};

/* ─── Component ───────────────────────────────────────────────── */

export default function RegisterPage() {
  usePageTitle('Register');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
  });

  async function onSubmit(data: RegisterInput) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      const user = await registerUser(data.name, data.email, data.password, data.gender, data.academicYear);
      navigate(getRoleHomePath(user.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function goNext() {
    const valid = await trigger(STEP_1_FIELDS);
    if (valid) {
      setDirection(1);
      setStep(2);
      setServerError(null);
    }
  }

  function goBack() {
    setDirection(-1);
    setStep(1);
    setServerError(null);
  }

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
          {/* Logo */}
          <motion.div variants={itemVariants} className="flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-xl bg-[hsl(var(--accent))] flex items-center justify-center shadow-lg shadow-[hsl(var(--accent))]/25">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
            </div>
            <span className="text-lg font-bold text-[hsl(var(--foreground))] tracking-tight">
              SmartHostel
            </span>
          </motion.div>

          {/* Heading */}
          <motion.div variants={itemVariants}>
            <h1 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--foreground))] tracking-tight gradient-heading">
              Create your account
            </h1>
            <p className="mt-2 text-[hsl(var(--muted-foreground))] text-sm">
              Join SmartHostel in a few easy steps
            </p>
          </motion.div>

          {/* ── Step indicator ──────────────────────────────────── */}
          <motion.div variants={itemVariants} className="mt-8 mb-8">
            <div className="flex items-center">
              {STEPS.map((s, i) => (
                <div key={s.num} className="flex items-center">
                  {/* Circle */}
                  <motion.div
                    className={`relative w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors duration-300 ${
                      step > s.num
                        ? 'bg-[hsl(var(--accent))] border-[hsl(var(--accent))] text-white'
                        : step === s.num
                          ? 'bg-[hsl(var(--accent))] border-[hsl(var(--accent))] text-white'
                          : 'bg-[hsl(var(--background))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))]'
                    }`}
                    animate={{
                      scale: step === s.num ? [1, 1.12, 1] : 1,
                    }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <AnimatePresence mode="wait">
                      {step > s.num ? (
                        <motion.div
                          key="check"
                          initial={{ scale: 0, rotate: -90 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          <Check className="w-4 h-4" />
                        </motion.div>
                      ) : (
                        <motion.span
                          key="num"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        >
                          {s.num}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* Connector line */}
                  {i < STEPS.length - 1 && (
                    <div className="relative w-24 sm:w-32 h-0.5 mx-2 bg-[hsl(var(--border))] rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-[hsl(var(--accent))] rounded-full"
                        initial={{ width: '0%' }}
                        animate={{ width: step > s.num ? '100%' : '0%' }}
                        transition={{ duration: 0.4, ease: 'easeInOut' }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* ── Form ───────────────────────────────────────────── */}
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="relative overflow-hidden min-h-[320px]">
              <AnimatePresence mode="wait" custom={direction}>
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    <FormField
                      label="Full Name"
                      id="name"
                      error={errors.name?.message}
                      inputProps={{
                        ...register('name'),
                        autoComplete: 'name',
                        placeholder: 'John Doe',
                      }}
                    />

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

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label
                          htmlFor="password"
                          className="block text-sm font-medium text-[hsl(var(--foreground))]"
                        >
                          Password
                        </label>
                      </div>
                      <div className="relative">
                        <input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Create a strong password"
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
                              key={showPassword ? 'hide' : 'show'}
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

                    {/* Continue button */}
                    <div className="pt-2">
                      <motion.button
                        type="button"
                        onClick={goNext}
                        className="group w-full min-h-[48px] rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[hsl(var(--accent))]/20"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={spring}
                      >
                        Continue
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </motion.button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="space-y-4"
                  >
                    <FormField
                      as="select"
                      label="Gender"
                      id="gender"
                      error={errors.gender?.message}
                      inputProps={{ ...register('gender'), defaultValue: '' }}
                    >
                      <option value="" disabled>Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </FormField>

                    <FormField
                      as="select"
                      label="Academic Year"
                      id="academicYear"
                      error={errors.academicYear?.message}
                      inputProps={{ ...register('academicYear'), defaultValue: '' }}
                    >
                      <option value="" disabled>Select year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </FormField>

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
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Back + Submit */}
                    <div className="pt-2 flex gap-3">
                      <motion.button
                        type="button"
                        onClick={goBack}
                        className="flex items-center justify-center gap-1.5 px-5 min-h-[48px] rounded-xl border-2 border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium hover:border-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/5 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={spring}
                      >
                        <ArrowLeft className="w-4 h-4" />
                        Back
                      </motion.button>
                      <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className="group flex-1 min-h-[48px] rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-[hsl(var(--accent))]/20 magnetic-hover"
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={spring}
                      >
                        {isSubmitting ? (
                          <Spinner />
                        ) : (
                          <>
                            Create Account
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <GoogleSignInButton onError={(msg) => setServerError(msg)} />

            <motion.p
              variants={itemVariants}
              className="text-sm text-center text-[hsl(var(--muted-foreground))] mt-4"
            >
              Already have an account?{' '}
              <Link to="/login" className="text-[hsl(var(--accent))] hover:underline font-medium">
                Sign in
              </Link>
            </motion.p>
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
            Join the SmartHostel community
          </motion.h2>

          <motion.p variants={rightItem} className="mt-5 text-indigo-200/80 text-lg leading-relaxed">
            Streamline your hostel experience with our all-in-one platform.
          </motion.p>

          {/* Steps preview */}
          <motion.div variants={rightStagger} className="mt-10 space-y-6">
            {STEPS.map((s) => (
              <motion.div
                key={s.num}
                variants={rightItem}
                className="flex items-center gap-4 group"
                whileHover={{ x: 4 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <motion.div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${
                    step >= s.num
                      ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                      : 'bg-white/10 text-white/60'
                  }`}
                  animate={{ scale: step === s.num ? [1, 1.1, 1] : 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                </motion.div>
                <div>
                  <p className={`font-semibold transition-colors duration-300 ${
                    step >= s.num ? 'text-white' : 'text-white/50'
                  }`}>
                    {s.label}
                  </p>
                  <p className={`text-sm transition-colors duration-300 ${
                    step >= s.num ? 'text-indigo-200/70' : 'text-white/30'
                  }`}>
                    {s.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Decorative image placeholder */}
          <motion.div
            variants={rightItem}
            className="mt-12 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/30"
          >
            <div className="aspect-[16/10] bg-gradient-to-br from-indigo-900/50 to-purple-900/50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-sm mx-auto mb-3 flex items-center justify-center">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                  </svg>
                </div>
                <p className="text-white/60 text-sm font-medium">Join SmartHostel</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
