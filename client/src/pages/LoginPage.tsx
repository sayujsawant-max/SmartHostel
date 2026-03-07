import { useState, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ApiError } from '@services/api';
import { getRoleHomePath } from '@utils/role-home';

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
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, hsl(222 47% 19%) 0%, hsl(173 78% 24%) 100%)',
      }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">SmartHostel</h1>
          <p className="text-white/70 mt-1">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white/95 backdrop-blur rounded-xl p-6 shadow-2xl"
        >
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">
                {errors.password.message}
              </p>
            )}
          </div>

          {serverError && (
            <div className="mb-4 text-sm text-red-600 text-center">
              <p>{serverError}</p>
              {isLocked && (
                <p className="mt-1 font-medium">
                  Try again in {lockoutSeconds} second{lockoutSeconds !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || isLocked}
            className="w-full min-h-[48px] rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 disabled:opacity-50 flex items-center justify-center"
          >
            {isSubmitting ? (
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : isLocked ? (
              `Locked (${lockoutSeconds}s)`
            ) : (
              'Sign in'
            )}
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-teal-600 hover:underline font-medium">
              Sign up
            </Link>
          </p>

          <div className="text-center mt-3">
            <Link to="/rooms" className="text-xs text-gray-500 hover:text-teal-600">
              Browse Rooms & Availability
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
