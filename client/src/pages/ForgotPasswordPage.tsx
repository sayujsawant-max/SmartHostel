import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { forgotPasswordSchema, type ForgotPasswordInput } from '@smarthostel/shared';
import { Link } from 'react-router-dom';
import { apiFetch } from '@services/api';
import { showError } from '@/utils/toast';
import AuthSplitLayout from '@components/ui/AuthSplitLayout';
import FormField from '@components/ui/FormField';
import Spinner from '@components/ui/Spinner';
import { motion } from 'motion/react';
import { usePageTitle } from '@hooks/usePageTitle';

const FORGOT_ICON = (
  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
  </svg>
);

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
    <AuthSplitLayout
      icon={FORGOT_ICON}
      title="SmartHostel"
      subtitle="Reset your password"
    >
      {success ? (
        <motion.div
          initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          className="text-center space-y-4"
        >
          <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto flex items-center justify-center">
            <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-sm text-gray-700">
            If an account exists with that email, a reset link has been sent. Check your inbox.
          </p>
          <p className="text-xs text-gray-500">
            In development mode, check the server console for the reset link.
          </p>
          <Link to="/login" className="inline-block text-sm text-[hsl(var(--accent))] hover:underline font-medium">
            Back to Sign In
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <p className="text-sm text-gray-600 mb-4">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>

          <FormField
            label="Email"
            id="email"
            error={errors.email?.message}
            className="mb-6"
            inputProps={{ ...register('email'), type: 'email', autoComplete: 'email' }}
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full min-h-[48px] rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center transition-all"
          >
            {isSubmitting ? <Spinner /> : 'Send Reset Link'}
          </button>

          <p className="text-sm text-center text-gray-600 mt-4">
            Remember your password?{' '}
            <Link to="/login" className="text-[hsl(var(--accent))] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthSplitLayout>
  );
}
