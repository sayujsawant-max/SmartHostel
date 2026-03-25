import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiFetch } from '@services/api';
import { motion } from 'motion/react';
import { Reveal } from '@/components/motion/Reveal';
import PageHeader from '@components/ui/PageHeader';
import StatusBadge, { type StatusVariant } from '@components/ui/StatusBadge';
import ErrorBanner from '@components/ui/ErrorBanner';
import EmptyState from '@components/EmptyState';
import { PageSkeleton } from '@components/Skeleton';

interface GatePass {
  _id: string;
  qrToken: string;
  passCode: string;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  lastGateState: 'IN' | 'OUT' | 'UNKNOWN';
  leaveId: string;
}

const STATUS_VARIANT: Record<string, StatusVariant> = {
  ACTIVE: 'success',
  EXPIRED: 'error',
  USED: 'info',
  CANCELLED: 'neutral',
};

export default function ShowQRPage() {
  const [gatePass, setGatePass] = useState<GatePass | null>(null);
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
      <div className="space-y-6">
        <Reveal><PageHeader title="Gate Pass" description="Display your active gate pass." /></Reveal>
        <PageSkeleton />
      </div>
    );
  }

  if (error && !gatePass) {
    return (
      <div className="space-y-6">
        <Reveal><PageHeader title="Gate Pass" description="Display your active gate pass." /></Reveal>
        <ErrorBanner message={error} />
        <Link to="/student/actions" className="text-[hsl(var(--accent))] text-sm underline">
          Back to actions
        </Link>
      </div>
    );
  }

  if (!gatePass) {
    return (
      <div className="space-y-6">
        <Reveal><PageHeader title="Gate Pass" description="Display your active gate pass." /></Reveal>
        <EmptyState
          title="No Active Pass"
          description="You need an approved leave to generate a gate pass."
          action={
            <div className="flex flex-col gap-3 items-center">
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
          }
        />
      </div>
    );
  }

  const expiresAt = new Date(gatePass.expiresAt);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 space-y-6">
      <Reveal>
        <PageHeader title="Your Gate Pass" />
      </Reveal>

      {/* Status badge */}
      <StatusBadge variant={STATUS_VARIANT[passStatus ?? ''] ?? 'neutral'}>
        {passStatus}
      </StatusBadge>

      {/* QR Code */}
      {passStatus === 'ACTIVE' && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0, filter: 'blur(6px)' }}
          animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          className="bg-white p-4 rounded-xl shadow-lg"
        >
          <QRCodeSVG
            value={gatePass.qrToken}
            size={Math.min(280, window.innerWidth * 0.6)}
            level="M"
          />
        </motion.div>
      )}

      {passStatus !== 'ACTIVE' && (
        <div className="p-8 rounded-xl border-2 border-dashed border-[hsl(var(--border))] text-center">
          <p className="text-[hsl(var(--muted-foreground))] text-sm">
            {passStatus === 'EXPIRED' ? 'This pass has expired' : `Pass is ${passStatus}`}
          </p>
        </div>
      )}

      {/* Fallback passcode */}
      <Reveal delay={0.15}>
        <div className="text-center space-y-2">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Fallback code:</p>
          <p className="text-3xl font-mono font-bold tracking-widest text-[hsl(var(--foreground))]">
            {gatePass.passCode}
          </p>
        </div>
      </Reveal>

      {/* Pass details card */}
      <Reveal delay={0.2}>
      <div className="w-full max-w-sm rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-glow p-4 space-y-3">
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
      </Reveal>

      {passStatus === 'ACTIVE' && (
        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">Turn brightness to max for scanning</p>
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
