import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, type RegisterInput } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { ApiError } from '@services/api';
import { getRoleHomePath } from '@utils/role-home';
import AuthSplitLayout from '@components/ui/AuthSplitLayout';
import FormField from '@components/ui/FormField';
import Spinner from '@components/ui/Spinner';
import { motion } from 'motion/react';

const REGISTER_ICON = (
  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
  </svg>
);

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
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

  return (
    <AuthSplitLayout
      icon={REGISTER_ICON}
      title="SmartHostel"
      subtitle="Create your account"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField
          label="Full Name"
          id="name"
          error={errors.name?.message}
          className="mb-4"
          inputProps={{ ...register('name'), autoComplete: 'name' }}
        />

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
          className="mb-4"
          inputProps={{ ...register('password'), type: 'password', autoComplete: 'new-password' }}
        />

        <FormField
          as="select"
          label="Gender"
          id="gender"
          error={errors.gender?.message}
          className="mb-4"
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
          className="mb-6"
          inputProps={{ ...register('academicYear'), defaultValue: '' }}
        >
          <option value="" disabled>Select year</option>
          <option value="1">1st Year</option>
          <option value="2">2nd Year</option>
          <option value="3">3rd Year</option>
          <option value="4">4th Year</option>
        </FormField>

        {serverError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4 text-sm text-[hsl(var(--destructive))] text-center"
          >
            <p>{serverError}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full min-h-[48px] rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center transition-all"
        >
          {isSubmitting ? <Spinner /> : 'Create Account'}
        </button>

        <p className="text-sm text-center text-[hsl(var(--muted-foreground))] mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-[hsl(var(--accent))] hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </form>
    </AuthSplitLayout>
  );
}
