import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { changePasswordSchema, type ChangePasswordInput } from '@smarthostel/shared';
import { useAuth } from '@hooks/useAuth';
import { apiFetch, ApiError } from '@services/api';
import { motion, AnimatePresence } from '@components/ui/motion';
import { Reveal } from '@/components/motion';

import FormField from '@components/ui/FormField';
import Spinner from '@components/ui/Spinner';
import StatusBadge from '@components/ui/StatusBadge';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  Settings,
  User,
  Lock,
  Info,
  LogOut,
  Shield,
  Mail,
  CheckCircle2,
  AlertCircle,
  Palette,
  Zap,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

export default function SettingsPage() {
  usePageTitle('Settings');
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

  const sectionItems = [
    {
      key: 'account',
      icon: User,
      iconBg: 'bg-blue-100 dark:bg-blue-950/40',
      iconColor: 'text-blue-600 dark:text-blue-400',
      title: 'Account',
      content: (
        <div className="space-y-3">
          {[
            { label: 'Name', value: user?.name ?? '—', icon: User },
            { label: 'Email', value: user?.email ?? '—', icon: Mail },
          ].map((item) => {
            const ItemIcon = item.icon;
            return (
              <div key={item.label} className="flex justify-between items-center text-sm group">
                <span className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                  <ItemIcon className="w-3.5 h-3.5" />
                  {item.label}
                </span>
                <span className="font-medium text-[hsl(var(--foreground))]">{item.value}</span>
              </div>
            );
          })}
          <div className="flex justify-between items-center text-sm">
            <span className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
              <Shield className="w-3.5 h-3.5" />
              Role
            </span>
            <StatusBadge variant="accent">{user?.role?.replace(/_/g, ' ') ?? '—'}</StatusBadge>
          </div>
        </div>
      ),
    },
    {
      key: 'password',
      icon: Lock,
      iconBg: 'bg-amber-100 dark:bg-amber-950/40',
      iconColor: 'text-amber-600 dark:text-amber-400',
      title: 'Change Password',
      content: (
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

          <AnimatePresence>
          {pwError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 text-sm text-[hsl(var(--destructive))] p-2.5 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {pwError}
            </motion.div>
          )}
          </AnimatePresence>
          <AnimatePresence>
          {pwSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/40"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Password changed successfully!
            </motion.div>
          )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={pwSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={spring}
            className="w-full py-2.5 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            {pwSubmitting ? (
              <>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Spinner />
                </motion.div>
                Updating...
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Update Password
              </>
            )}
          </motion.button>
        </form>
      ),
    },
    {
      key: 'app',
      icon: Info,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/40',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      title: 'Application',
      content: (
        <div className="space-y-3">
          {[
            { label: 'Version', value: '1.0.1', icon: Zap },
            { label: 'Theme', value: 'System Default', icon: Palette },
          ].map((item) => {
            const ItemIcon = item.icon;
            return (
              <div key={item.label} className="flex justify-between items-center text-sm">
                <span className="flex items-center gap-2 text-[hsl(var(--muted-foreground))]">
                  <ItemIcon className="w-3.5 h-3.5" />
                  {item.label}
                </span>
                <span className="font-medium text-[hsl(var(--foreground))]">{item.value}</span>
              </div>
            );
          })}
        </div>
      ),
    },
    {
      key: 'actions',
      icon: LogOut,
      iconBg: 'bg-red-100 dark:bg-red-950/40',
      iconColor: 'text-red-600 dark:text-red-400',
      title: 'Actions',
      content: (
        <AnimatePresence mode="wait">
          {showLogoutConfirm ? (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="text-sm text-[hsl(var(--foreground))]">Sign out of your account?</span>
              <motion.button
                onClick={() => void logout()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                className="px-3 py-1.5 rounded-lg bg-[hsl(var(--destructive))] text-white text-sm font-medium"
              >
                Confirm
              </motion.button>
              <motion.button
                onClick={() => setShowLogoutConfirm(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={spring}
                className="px-3 py-1.5 rounded-lg text-sm text-[hsl(var(--muted-foreground))] hover:underline"
              >
                Cancel
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="button"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <motion.button
                onClick={() => setShowLogoutConfirm(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
                className="w-full py-2.5 rounded-xl border border-[hsl(var(--destructive))]/30 text-[hsl(var(--destructive))] text-sm font-medium hover:bg-[hsl(var(--destructive))]/5 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-600/10 via-[hsl(var(--card))] to-blue-600/10 border border-[hsl(var(--border))] p-6 morph-gradient"
      >
        <div className="absolute top-4 right-4 opacity-10">
          <motion.div
            animate={{ rotate: [0, 90, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Settings className="w-24 h-24 text-slate-500" />
          </motion.div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-950/40 flex items-center justify-center"
            whileHover={{ rotate: 90, scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Settings className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] gradient-heading">Settings</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Account info and hostel preferences</p>
          </div>
        </div>
      </motion.div>

      {/* Settings Sections */}
      <Reveal>
      <div className="space-y-4">
        {sectionItems.map((section, i) => {
          const SectionIcon = section.icon;
          return (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 0.4, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                whileHover={{ y: -2, scale: 1.003 }}
                transition={spring}
                className="card-glow card-shine p-5 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-4 hover:shadow-md hover:border-[hsl(var(--accent))]/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${section.iconBg} ${section.iconColor}`}
                    whileHover={{ rotate: section.key === 'app' ? 360 : 12, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <SectionIcon className="w-4.5 h-4.5" />
                  </motion.div>
                  <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">{section.title}</h3>
                </div>
                {section.content}
              </motion.div>
            </motion.div>
          );
        })}
      </div>
      </Reveal>
    </div>
  );
}
