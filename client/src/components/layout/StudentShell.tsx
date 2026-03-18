import { Outlet, NavLink, Link } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import NotificationBell from '@components/NotificationBell';
import ThemeToggle from '@components/ThemeToggle';
import SosButton from '@components/SosButton';
import { motion, PageTransition } from '@components/ui/motion';

const tabs = [
  { label: 'Status', to: '/student/status' },
  { label: 'Actions', to: '/student/actions' },
  { label: 'Menu', to: '/student/mess-menu' },
  { label: 'Laundry', to: '/student/laundry' },
  { label: 'FAQ', to: '/student/faq' },
] as const;

export default function StudentShell() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      {/* Top bar */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between px-4 py-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] shadow-sm"
      >
        <h1 className="text-lg font-bold text-[hsl(var(--foreground))]">SmartHostel</h1>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <ThemeToggle />
          <Link to="/student/profile" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">{user?.name}</Link>
          <button
            onClick={() => void logout()}
            className="text-sm px-3 py-1.5 rounded-lg bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] font-medium hover:opacity-90"
          >
            Logout
          </button>
        </div>
      </motion.header>

      {/* Main content with page transition */}
      <main className="flex-1 overflow-y-auto p-4 pb-20">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <SosButton />

      {/* Bottom tab bar */}
      <motion.nav
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="fixed bottom-0 left-0 right-0 flex bg-[hsl(var(--card))] border-t border-[hsl(var(--border))] shadow-lg"
      >
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 flex items-center justify-center py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'text-[hsl(var(--accent))] border-t-2 border-[hsl(var(--accent))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </motion.nav>
    </div>
  );
}
