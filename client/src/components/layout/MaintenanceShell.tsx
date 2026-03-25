import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import NotificationBell from '@components/NotificationBell';
import ThemeToggle from '@components/ThemeToggle';
import { motion, PageTransition } from '@components/ui/motion';
import { ClipboardList, History, HelpCircle, LogOut, Wrench, User, Package, QrCode } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 500, damping: 30 };

const tabs = [
  { label: 'Tasks', to: '/maintenance/tasks', icon: ClipboardList },
  { label: 'History', to: '/maintenance/history', icon: History },
  { label: 'Inventory', to: '/maintenance/inventory', icon: Package },
  { label: 'Assets', to: '/maintenance/assets', icon: QrCode },
  { label: 'FAQ', to: '/maintenance/faq', icon: HelpCircle },
] as const;

export default function MaintenanceShell() {
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
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-8 h-8 rounded-lg bg-orange-600 flex items-center justify-center shadow-sm shadow-orange-500/20"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
          >
            <Wrench className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-[hsl(var(--foreground))] leading-tight">SmartHostel</h1>
            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-medium leading-tight">Maintenance</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <NotificationBell />
          <ThemeToggle />
          <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))]">
            <span className="hidden sm:inline font-medium">{user?.name}</span>
            <motion.div
              className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={spring}
            >
              <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </motion.div>
          </div>
          <motion.button
            onClick={() => void logout()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </motion.button>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

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
              className="flex-1 relative flex flex-col items-center justify-center py-2.5 gap-0.5"
            >
              {isActive && (
                <motion.div
                  layoutId="maintenance-tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-orange-600"
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
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-[hsl(var(--muted-foreground))]'
                  }`}
                />
              </motion.div>
              <span
                className={`text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'text-orange-600 dark:text-orange-400'
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
