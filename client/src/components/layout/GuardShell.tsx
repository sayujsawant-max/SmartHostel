import { Outlet } from 'react-router-dom';

export default function GuardShell() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <Outlet />
    </div>
  );
}
