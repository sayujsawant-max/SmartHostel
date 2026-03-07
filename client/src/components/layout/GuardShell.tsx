import { Outlet } from 'react-router-dom';
import ThemeToggle from '@components/ThemeToggle';

export default function GuardShell() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="flex items-center justify-between px-4 py-3 bg-[hsl(var(--card))] border-b border-[hsl(var(--border))] shadow-sm">
        <h1 className="text-lg font-bold text-[hsl(var(--foreground))]">SmartHostel</h1>
        <ThemeToggle />
      </header>
      <Outlet />
    </div>
  );
}
