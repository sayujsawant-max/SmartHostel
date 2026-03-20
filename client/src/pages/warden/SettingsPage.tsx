import { useState } from 'react';
import { useAuth } from '@hooks/useAuth';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge from '@components/ui/StatusBadge';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <div className="space-y-6">
      <Reveal>
        <PageHeader title="Settings" description="Account info and hostel preferences." />
      </Reveal>

      <StaggerContainer stagger={0.06} className="space-y-4">
        {/* Account Info */}
        <StaggerItem>
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
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

        {/* App Info */}
        <StaggerItem>
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
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
          <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3">
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
