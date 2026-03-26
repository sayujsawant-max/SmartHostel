import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import NotificationBell from '@components/NotificationBell';
import ThemeToggle from '@components/ThemeToggle';
import { motion, AnimatePresence } from 'motion/react';
import { pageTransition } from '@/utils/motion';
import {
  ClipboardList,
  History,
  HelpCircle,
  LogOut,
  Wrench,
  Package,
  QrCode,
  Menu,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

const navLinks = [
  { label: 'Active Tasks', to: '/maintenance/tasks', icon: ClipboardList },
  { label: 'History', to: '/maintenance/history', icon: History },
  { label: 'Inventory', to: '/maintenance/inventory', icon: Package },
  { label: 'Asset Tracking', to: '/maintenance/assets', icon: QrCode },
  { label: 'FAQ', to: '/maintenance/faq', icon: HelpCircle },
] as const;

function SidebarContent({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-[hsl(var(--border))]">
        <div className="flex items-center gap-2.5">
          <motion.div
            className="w-9 h-9 rounded-lg bg-amber-600 flex items-center justify-center shadow-sm shadow-amber-500/20"
            whileHover={{ scale: 1.1, rotate: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={spring}
          >
            <Wrench className="w-4.5 h-4.5 text-white" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold text-[hsl(var(--foreground))] leading-tight">SmartHostel</h1>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium leading-tight">Maintenance</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto scrollbar-none">
        {navLinks.map((link, idx) => {
          const isActive = location.pathname.startsWith(link.to);
          const Icon = link.icon;
          return (
            <motion.div
              key={link.to}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03, duration: 0.25 }}
            >
              <NavLink
                to={link.to}
                className="relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {isActive && (
                  <motion.div
                    layoutId="maintenance-sidebar-active"
                    className="absolute inset-0 rounded-xl bg-amber-600 dark:bg-amber-500"
                    transition={spring}
                    style={{ zIndex: 0 }}
                  />
                )}
                <Icon className={`w-4.5 h-4.5 relative z-10 transition-colors ${
                  isActive ? 'text-white' : 'text-[hsl(var(--muted-foreground))]'
                }`} />
                <span className={`relative z-10 transition-colors ${
                  isActive
                    ? 'text-white'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }`}>
                  {link.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="maintenance-sidebar-dot"
                    className="absolute right-3 w-1.5 h-1.5 rounded-full bg-white z-10"
                    transition={spring}
                  />
                )}
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-[hsl(var(--border))] space-y-3">
        {user && (
          <div className="flex items-center gap-2.5 px-1">
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[hsl(var(--foreground))] truncate">{user.name}</p>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Maintenance Staff</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <motion.button
            onClick={onLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={spring}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--destructive))] hover:border-[hsl(var(--destructive))]/30 hover:bg-[hsl(var(--destructive))]/5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceShell() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const handleLogout = () => void logout();

  return (
    <div className="min-h-screen flex bg-[hsl(var(--background))]">
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -64, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="hidden lg:flex lg:w-64 lg:flex-col glass-strong border-r border-[hsl(var(--border))]"
      >
        <SidebarContent onLogout={handleLogout} />
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 w-64 glass-strong border-r border-[hsl(var(--border))] z-50 lg:hidden"
            >
              <SidebarContent onLogout={handleLogout} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <motion.header
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="flex items-center px-4 py-3 glass-strong border-b border-[hsl(var(--border))] lg:hidden"
        >
          <motion.button
            onClick={() => setMenuOpen(true)}
            whileTap={{ scale: 0.9 }}
            className="p-2 -ml-2 rounded-lg text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
          <h1 className="ml-3 flex-1 text-lg font-bold text-[hsl(var(--foreground))]">SmartHostel</h1>
          <ThemeToggle />
          <NotificationBell />
        </motion.header>

        {/* Desktop top bar with notification */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="hidden lg:flex items-center justify-end px-6 py-3 border-b border-[hsl(var(--border))] glass-strong"
        >
          <NotificationBell />
        </motion.header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div key={location.pathname} {...pageTransition}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
