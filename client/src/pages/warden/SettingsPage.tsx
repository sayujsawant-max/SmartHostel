import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { apiFetch, ApiError } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import PageHeader from '@components/ui/PageHeader';
import FormField from '@components/ui/FormField';
import Spinner from '@components/ui/Spinner';
import StatusBadge from '@components/ui/StatusBadge';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onBlur',
  });

  async function onChangePassword(data: ChangePasswordInput) {
    setPwError(null);
    setPwSuccess(false);
    setPwSubmitting(true);
    try {
      await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      setPwSuccess(true);
      reset();
    } catch (err) {
      if (err instanceof ApiError) {
        setPwError(err.message);
      } else {
        setPwError('An unexpected error occurred');
      }
    } finally {
      setPwSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader title="Settings" description="Account info and hostel preferences." />
      </Reveal>

      <StaggerContainer stagger={0.06} className="space-y-4">
        {/* Account Info */}
        <StaggerItem>
          <div className="card-glow p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Account</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Name</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{user?.name ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Email</span>
                <span className="font-medium text-[hsl(var(--foreground))]">{user?.email ?? '—'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Role</span>
                <StatusBadge variant="accent">{user?.role?.replace(/_/g, ' ') ?? '—'}</StatusBadge>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Change Password */}
        <StaggerItem>
          <div className="card-glow p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Change Password</h3>
            <form onSubmit={handleSubmit(onChangePassword)} className="space-y-3">
              <FormField
                label="Current Password"
                id="currentPassword"
                error={errors.currentPassword?.message}
                inputProps={{ ...register('currentPassword'), type: 'password', autoComplete: 'current-password' }}
              />
              <FormField
                label="New Password"
                id="newPassword"
                error={errors.newPassword?.message}
                inputProps={{ ...register('newPassword'), type: 'password', autoComplete: 'new-password', placeholder: 'At least 8 characters' }}
              />

              {pwError && (
                <p className="text-sm text-[hsl(var(--destructive))] text-center">{pwError}</p>
              )}
              {pwSuccess && (
                <p className="text-sm text-green-600 dark:text-green-400 text-center">Password changed successfully!</p>
              )}

              <button
                type="submit"
                disabled={pwSubmitting}
                className="w-full py-2.5 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-medium hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center transition-all"
              >
                {pwSubmitting ? <Spinner /> : 'Update Password'}
              </button>
            </form>
          </div>
        </StaggerItem>

        {/* App Info */}
        <StaggerItem>
          <div className="card-glow p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Application</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Version</span>
                <span className="font-medium text-[hsl(var(--foreground))]">1.0.1</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[hsl(var(--muted-foreground))]">Theme</span>
                <span className="font-medium text-[hsl(var(--foreground))]">System Default</span>
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Quick Actions */}
        <StaggerItem>
          <div className="card-glow p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
            <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">Actions</h3>

            {showLogoutConfirm ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[hsl(var(--foreground))]">Sign out of your account?</span>
                <button
                  onClick={() => void logout()}
                  className="px-3 py-1.5 rounded-lg bg-[hsl(var(--destructive))] text-white text-sm font-medium"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-3 py-1.5 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:underline"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="w-full py-2.5 rounded-lg border border-[hsl(var(--destructive))]/30 text-[hsl(var(--destructive))] text-sm font-medium hover:bg-[hsl(var(--destructive))]/5 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </StaggerItem>
      </StaggerContainer>
    </div>
  );
}
