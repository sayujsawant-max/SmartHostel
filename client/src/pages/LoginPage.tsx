import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ApiError } from '@services/api';
import { getRoleHomePath } from '@utils/role-home';
import AuthSplitLayout from '@components/ui/AuthSplitLayout';
import FormField from '@components/ui/FormField';
import Spinner from '@components/ui/Spinner';
import { motion } from 'motion/react';

const LOGIN_ICON = (
  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
  </svg>
);

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockoutMs, setLockoutMs] = useState<number>(0);
  const lockoutTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    <AuthSplitLayout
      icon={LOGIN_ICON}
      title="SmartHostel"
      subtitle="Sign in to your account"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField
          label="Email"
          id="email"
          error={errors.email?.message}
          className="mb-4"
          inputProps={{ ...register('email'), type: 'email', autoComplete: 'email' }}
        />

        <FormField
          label="Password"
          id="password"
          error={errors.password?.message}
          className="mb-6"
          inputProps={{ ...register('password'), type: 'password', autoComplete: 'current-password' }}
        />

        {serverError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 text-sm text-[hsl(var(--destructive))] text-center"
          >
            <p>{serverError}</p>
            {isLocked && (
              <p className="mt-1 font-medium">
                Try again in {lockoutSeconds} second{lockoutSeconds !== 1 ? 's' : ''}
              </p>
            )}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isLocked}
          className="w-full min-h-[48px] rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center transition-all"
        >
          {isSubmitting ? (
            <Spinner />
          ) : isLocked ? (
            `Locked (${lockoutSeconds}s)`
          ) : (
            'Sign in'
          )}
        </button>

        <p className="text-sm text-center text-[hsl(var(--muted-foreground))] mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-[hsl(var(--accent))] hover:underline font-medium">
            Sign up
          </Link>
        </p>

        <div className="text-center mt-3">
          <Link to="/rooms" className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--accent))] transition-colors">
            Browse Rooms &amp; Availability
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}
