import { useAuth } from '@hooks/useAuth';

export default function ScanPage() {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(var(--background))] p-4">
      <div className="w-full max-w-sm text-center">
        <div className="w-64 h-64 mx-auto rounded-2xl border-4 border-dashed border-[hsl(var(--muted-foreground))] flex items-center justify-center mb-6">
          <p className="text-[hsl(var(--muted-foreground))] text-sm">QR Scanner Placeholder</p>
        </div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Guard Scanner</h2>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">Point camera at student QR code to verify gate pass.</p>
        <button
          onClick={() => void logout()}
          className="mt-8 px-4 py-2 rounded-lg bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] text-sm font-medium hover:opacity-90"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
