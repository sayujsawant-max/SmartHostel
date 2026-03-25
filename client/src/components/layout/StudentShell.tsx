import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import NotificationBell from '@components/NotificationBell';
import ThemeToggle from '@components/ThemeToggle';
import SosButton from '@components/SosButton';
import { motion, PageTransition } from '@components/ui/motion';
import { Home, Zap, UtensilsCrossed, Shirt, HelpCircle, LogOut, User } from 'lucide-react';

const tabs = [
  { label: 'Dashboard', to: '/student/status', icon: Home, prefetch: () => import('@pages/student/StatusPage') },
  { label: 'Actions', to: '/student/actions', icon: Zap, prefetch: () => import('@pages/student/ActionsPage') },
  { label: 'Menu', to: '/student/mess-menu', icon: UtensilsCrossed, prefetch: () => import('@pages/student/MessMenuPage') },
  { label: 'Laundry', to: '/student/laundry', icon: Shirt, prefetch: () => import('@pages/student/LaundryBookingPage') },
  { label: 'Help', to: '/student/faq', icon: HelpCircle, prefetch: () => import('@pages/student/FaqPage') },
] as const;

const spring = { type: 'spring' as const, stiffness: 500, damping: 30 };

export default function StudentShell() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      {/* Top bar */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between px-4 py-3 glass-strong border-b border-[hsl(var(--border))] shadow-sm"
      >
        <Link to="/student/status" className="flex items-center gap-2.5">
          <motion.div
            className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-500/20"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-[hsl(var(--foreground))] leading-tight">SmartHostel</h1>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium leading-tight">Student Portal</p>
          </div>
        </Link>
        <div className="flex items-center gap-2.5">
          <NotificationBell />
          <ThemeToggle />
          <Link
            to="/student/profile"
            className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors"
          >
            <span className="hidden sm:inline font-medium">{user?.name}</span>
            {user?.roomNumber && (
              <span className="hidden sm:inline text-xs text-[hsl(var(--muted-foreground))]">
                Room {user.roomNumber}
              </span>
            )}
            <motion.div
              className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/50 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
            >
              <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </motion.div>
          </Link>
          <motion.button
            onClick={() => void logout()}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Main content with page transition */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
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
        className="fixed bottom-0 left-0 right-0 flex glass-strong border-t border-[hsl(var(--border))] shadow-lg z-40"
      >
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.to);
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              onMouseEnter={() => void tab.prefetch()}
              onFocus={() => void tab.prefetch()}
              className="flex-1 relative flex flex-col items-center justify-center py-2.5 gap-0.5"
            >
              {isActive && (
                <motion.div
                  layoutId="student-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-600"
                  transition={spring}
                />
              )}
              <motion.div
                animate={isActive ? { scale: 1, y: 0 } : { scale: 0.9, y: 0 }}
                transition={spring}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-[hsl(var(--muted-foreground))]'
                  }`}
                />
              </motion.div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-[hsl(var(--muted-foreground))]'
                }`}
              >
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </motion.nav>
    </div>
  );
}
