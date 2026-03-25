import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import ThemeToggle from '@components/ThemeToggle';
import { motion, PageTransition } from '@components/ui/motion';
import { ScanLine, UserCheck, LogOut, Shield, BarChart3 } from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 500, damping: 30 };

const tabs = [
  { label: 'Scan', to: '/guard/scan', icon: ScanLine },
  { label: 'Visitors', to: '/guard/visitors', icon: UserCheck },
  { label: 'Analytics', to: '/guard/analytics', icon: BarChart3 },
] as const;

export default function GuardShell() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between px-4 py-3 glass-strong border-b border-[hsl(var(--border))] shadow-sm"
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-8 h-8 rounded-lg bg-slate-800 dark:bg-slate-700 flex items-center justify-center shadow-sm"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
          >
            <Shield className="w-4 h-4 text-white" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-[hsl(var(--foreground))] leading-tight">SmartHostel</h1>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-medium leading-tight">Gate Security</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab navigation */}
          <div className="flex items-center gap-1 bg-[hsl(var(--muted))] rounded-xl p-1">
            {tabs.map((tab) => {
              const isActive = location.pathname.startsWith(tab.to);
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  {isActive && (
                    <motion.div
                      layoutId="guard-tab-bg"
                      className="absolute inset-0 rounded-lg bg-[hsl(var(--card))] shadow-sm"
                      transition={spring}
                      style={{ zIndex: 0 }}
                    />
                  )}
                  <Icon className={`w-3.5 h-3.5 relative z-10 ${
                    isActive ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
                  }`} />
                  <span className={`relative z-10 ${
                    isActive ? 'text-[hsl(var(--foreground))]' : 'text-[hsl(var(--muted-foreground))]'
                  }`}>
                    {tab.label}
                  </span>
                </NavLink>
              );
            })}
          </div>

          <ThemeToggle />

          {user && (
            <span className="hidden sm:inline text-sm font-medium text-[hsl(var(--muted-foreground))]">{user.name}</span>
          )}

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

      <main className="flex-1 overflow-y-auto">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
    </div>
  );
}
