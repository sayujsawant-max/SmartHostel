import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '@hooks/useAuth';
import NotificationBell from '@components/NotificationBell';
import ThemeToggle from '@components/ThemeToggle';

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
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-[hsl(var(--border))] space-y-2">
        <div className="flex items-center gap-2 px-1">
          <ThemeToggle />
          <span className="text-xs text-[hsl(var(--muted-foreground))]">Theme</span>
        </div>
        <button
          onClick={onLogout}
          className="w-full px-3 py-2 rounded-lg text-sm font-medium bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:opacity-90"
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
      <aside className="hidden lg:flex lg:w-64 lg:flex-col bg-[hsl(var(--card))] border-r border-[hsl(var(--border))]">
        <SidebarContent onLogout={handleLogout} />
      </aside>

      {/* Mobile overlay */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-[hsl(var(--card))] border-r border-[hsl(var(--border))] z-50 lg:hidden">
            <SidebarContent onLogout={handleLogout} />
          </aside>
        </>
      )}

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="flex items-center px-4 py-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] lg:hidden">
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
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
