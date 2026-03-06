import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '@services/api';

interface GatePass {
  _id: string;
  qrToken: string;
  passCode: string;
  expiresAt: string;
}

export default function ShowQRPage() {
  const [gatePass, setGatePass] = useState<GatePass | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch<{ gatePass: GatePass | null }>('/gate-passes/active')
      .then((res) => setGatePass(res.data.gatePass))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Wake Lock to keep screen on at the gate
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null;

    if (gatePass && 'wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then((lock) => { wakeLock = lock; })
        .catch(() => { /* Wake Lock not supported or denied */ });
    }

    return () => {
      wakeLock?.release();
    };
  }, [gatePass]);

  if (loading) {
    return <div className="p-4 text-center text-[hsl(var(--muted-foreground))]">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-600">{error}</div>;
  }

  if (!gatePass) {
    return (
      <div className="p-4 text-center py-12">
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">No Active Pass</h2>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">
          You don't have an active approved pass.
        </p>
        <Link to="/student/actions" className="text-blue-600 mt-4 inline-block">
          Request a leave
        </Link>
      </div>
    );
  }

  const expiresAt = new Date(gatePass.expiresAt);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 space-y-6">
      <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Your Gate Pass</h2>

      <div className="bg-white p-4 rounded-xl shadow-lg">
        <QRCodeSVG
          value={gatePass.qrToken}
          size={Math.min(280, window.innerWidth * 0.6)}
          level="M"
        />
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Fallback code:</p>
        <p className="text-3xl font-mono font-bold tracking-widest text-[hsl(var(--foreground))]">
          {gatePass.passCode}
        </p>
      </div>

      <div className="text-center text-sm text-[hsl(var(--muted-foreground))] space-y-1">
        <p>
          Return by: {expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
          {expiresAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </p>
        <p className="text-xs text-orange-600 font-medium">Turn brightness to max for scanning</p>
      </div>

      <Link
        to="/student/status"
        className="text-sm text-blue-600 underline"
      >
        Back to status
      </Link>
    </div>
  );
}
