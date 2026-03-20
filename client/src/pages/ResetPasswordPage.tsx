import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { selfResetPasswordSchema, type SelfResetPasswordInput } from '@smarthostel/shared';
import { Link, useSearchParams } from 'react-router-dom';
import { apiFetch, ApiError } from '@services/api';
import AuthSplitLayout from '@components/ui/AuthSplitLayout';
import FormField from '@components/ui/FormField';
import Spinner from '@components/ui/Spinner';
import { motion } from 'motion/react';

const RESET_ICON = (
  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SelfResetPasswordInput>({
    resolver: zodResolver(selfResetPasswordSchema),
    defaultValues: { token },
    mode: 'onBlur',
  });

  async function onSubmit(data: SelfResetPasswordInput) {
    setServerError(null);
    setIsSubmitting(true);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setSuccess(true);
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

  if (!token) {
    return (
      <AuthSplitLayout icon={RESET_ICON} title="SmartHostel" subtitle="Reset your password">
        <div className="text-center space-y-4">
          <p className="text-sm text-red-600">Invalid or missing reset token.</p>
          <Link to="/forgot-password" className="inline-block text-sm text-teal-600 hover:underline font-medium">
            Request a new reset link
          </Link>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout icon={RESET_ICON} title="SmartHostel" subtitle="Set a new password">
      {success ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center">
            <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm text-gray-700">
            Your password has been reset successfully.
          </p>
          <Link to="/login" className="inline-block text-sm text-teal-600 hover:underline font-medium">
            Sign in with your new password
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register('token')} />

          <FormField
            label="New Password"
            id="password"
            error={errors.password?.message}
            className="mb-6"
            inputProps={{ ...register('password'), type: 'password', autoComplete: 'new-password', placeholder: 'At least 8 characters' }}
          />

          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 text-sm text-red-600 text-center"
            >
              <p>{serverError}</p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center transition-all"
          >
            {isSubmitting ? <Spinner /> : 'Reset Password'}
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            <Link to="/login" className="text-teal-600 hover:underline font-medium">
              Back to Sign In
            </Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  );
}
