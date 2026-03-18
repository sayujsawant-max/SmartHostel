import { Outlet, NavLink } from 'react-router-dom';
import ThemeToggle from '@components/ThemeToggle';
import { motion } from '@components/ui/motion';

const tabs = [
  { label: 'Scan', to: '/guard/scan' },
  { label: 'Visitors', to: '/guard/visitors' },
] as const;

export default function GuardShell() {
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(var(--background))]">
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="flex items-center justify-between px-4 py-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] shadow-sm"
      >
        <h1 className="text-lg font-bold text-[hsl(var(--foreground))]">SmartHostel</h1>
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                    : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
          <ThemeToggle />
        </div>
      </motion.header>
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
