import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '@services/api';

interface GatePass {
  _id: string;
  qrToken: string;
  passCode: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  lastGateState: 'IN' | 'OUT' | 'UNKNOWN';
  leaveId: string;
}

interface LeaveInfo {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
}

export default function ShowQRPage() {
  const [gatePass, setGatePass] = useState<GatePass | null>(null);
  const [leave, setLeave] = useState<LeaveInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchActivePass = useCallback(async () => {
    try {
      const res = await apiFetch<{ gatePass: GatePass | null }>('/gate-passes/active');
      setGatePass(res.data.gatePass);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gate pass');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchActivePass();
  }, [fetchActivePass]);

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

  // Fetch leave details when gate pass is loaded
  useEffect(() => {
    if (!gatePass) {
      setLeave(null);
      return;
    }

    apiFetch<{ gatePass: GatePass }>('/gate-passes/active')
      .then(() => {
        // We already have the gate pass; leave details come from the verify endpoint
        // but that's guard-only. We'll display what we have from the pass itself.
      })
      .catch(() => { /* ignore */ });
  }, [gatePass]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await apiFetch<{ qrToken: string; gatePass: GatePass }>('/gate-passes/generate', {
        method: 'POST',
      });
      setGatePass(res.data.gatePass);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate pass');
    } finally {
      setGenerating(false);
    }
  };

  const passStatus = gatePass
    ? (new Date(gatePass.expiresAt) < new Date() ? 'EXPIRED' : gatePass.status)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-[hsl(var(--accent))] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error && !gatePass) {
    return (
      <div className="p-4 text-center py-12">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[hsl(var(--destructive)/0.1)] flex items-center justify-center">
          <span className="text-2xl text-[hsl(var(--destructive))]">!</span>
        </div>
        <p className="text-[hsl(var(--destructive))]">{error}</p>
        <Link to="/student/actions" className="text-[hsl(var(--accent))] mt-4 inline-block text-sm underline">
          Back to actions
        </Link>
      </div>
    );
  }

  if (!gatePass) {
    return (
      <div className="p-4 text-center py-12 space-y-4">
        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
          <svg className="w-10 h-10 text-[hsl(var(--muted-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">No Active Pass</h2>
        <p className="text-[hsl(var(--muted-foreground))] text-sm">
          You need an approved leave to generate a gate pass.
        </p>
        <div className="flex flex-col gap-3 items-center pt-4">
          <button
            onClick={() => void handleGenerate()}
            disabled={generating}
            className="px-6 py-3 rounded-lg bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-medium text-sm disabled:opacity-50 transition-opacity"
          >
            {generating ? 'Generating...' : 'Generate Pass'}
          </button>
          {error && <p className="text-[hsl(var(--destructive))] text-sm">{error}</p>}
          <Link to="/student/actions" className="text-[hsl(var(--muted-foreground))] text-sm underline">
            Request a leave
          </Link>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(gatePass.expiresAt);
  const statusColor =
    passStatus === 'ACTIVE'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : passStatus === 'EXPIRED'
        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        : passStatus === 'USED'
          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
          : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 space-y-6">
      <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Your Gate Pass</h2>

      {/* Status badge */}
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColor}`}>
        {passStatus}
      </span>

      {/* QR Code */}
      {passStatus === 'ACTIVE' && (
        <div className="bg-white p-4 rounded-xl shadow-lg">
          <QRCodeSVG
            value={gatePass.qrToken}
            size={Math.min(280, window.innerWidth * 0.6)}
            level="M"
          />
        </div>
      )}

      {passStatus !== 'ACTIVE' && (
        <div className="p-8 rounded-xl border-2 border-dashed border-[hsl(var(--border))] text-center">
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            {passStatus === 'EXPIRED' ? 'This pass has expired' : `Pass is ${passStatus}`}
          </p>
        </div>
      )}

      {/* Fallback passcode */}
      <div className="text-center space-y-2">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Fallback code:</p>
        <p className="text-3xl font-mono font-bold tracking-widest text-[hsl(var(--foreground))]">
          {gatePass.passCode}
        </p>
      </div>

      {/* Pass details card */}
      <div className="w-full max-w-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-[hsl(var(--muted-foreground))]">Gate State</span>
          <span className="font-medium text-[hsl(var(--foreground))]">{gatePass.lastGateState}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[hsl(var(--muted-foreground))]">Return by</span>
          <span className="font-medium text-[hsl(var(--foreground))]">
            {expiresAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{' '}
            {expiresAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {passStatus === 'ACTIVE' && (
        <p className="text-xs text-orange-600 font-medium">Turn brightness to max for scanning</p>
      )}

      <Link
        to="/student/status"
        className="text-sm text-[hsl(var(--muted-foreground))] underline"
      >
        Back to status
      </Link>
    </div>
  );
}
