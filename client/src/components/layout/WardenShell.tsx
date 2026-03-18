import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import NotificationBell from '@components/NotificationBell';
import ThemeToggle from '@components/ThemeToggle';
import { motion, AnimatePresence, PageTransition } from '@components/ui/motion';

const navLinks = [
  { label: 'Dashboard', to: '/warden/dashboard' },
  { label: 'Students', to: '/warden/students' },
  { label: 'Complaints', to: '/warden/complaints' },
  { label: 'Notices', to: '/warden/notices' },
  { label: 'Rooms', to: '/warden/rooms' },
  { label: 'Mess Menu', to: '/warden/mess-menu' },
  { label: 'Laundry', to: '/warden/laundry' },
  { label: 'Visitors', to: '/warden/visitors' },
  { label: 'Room Changes', to: '/warden/room-changes' },
  { label: 'Reports', to: '/warden/reports' },
  { label: 'Users', to: '/warden/users' },
  { label: 'Settings', to: '/warden/settings' },
] as const;

function SidebarContent({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-5 border-b border-[hsl(var(--border))]">
        <h1 className="text-xl font-bold text-[hsl(var(--foreground))]">SmartHostel</h1>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">Warden Panel</p>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navLinks.map((link, idx) => (
          <motion.div
            key={link.to}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.03, duration: 0.25 }}
          >
            <NavLink
              to={link.to}
              className={({ isActive }) =>
                `block px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
                }`
              }
            >
              {link.label}
            </NavLink>
          </motion.div>
        ))}
      </nav>
      <div className="p-4 border-t border-[hsl(var(--border))] space-y-2">
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Theme</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90 transition-opacity"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

export default function WardenShell() {
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => void logout();

  return (
    <div className="min-h-screen flex bg-[hsl(var(--background))]">
      {/* Desktop sidebar */}
      <motion.aside
        initial={{ x: -64, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="hidden lg:flex lg:w-64 lg:flex-col bg-[hsl(var(--card))] border-r border-[hsl(var(--border))]"
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
              className="fixed inset-y-0 left-0 w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] z-50 lg:hidden"
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
          className="flex items-center px-4 py-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] lg:hidden"
        >
          <button
            onClick={() => setMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="ml-3 flex-1 text-lg font-bold text-[hsl(var(--foreground))]">SmartHostel</h1>
          <ThemeToggle />
          <NotificationBell />
        </motion.header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>
    </div>
  );
}
