import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '@hooks/useAuth';
import { apiFetch, ApiError } from '@services/api';
import { Reveal } from '@/components/motion/Reveal';
import { showError, showSuccess } from '@/utils/toast';

type Verdict = 'ALLOW' | 'DENY' | 'OFFLINE' | null;

interface OfflineScanEntry {
  scanAttemptId: string;
  qrToken?: string;
  passCode?: string;
  scannedAt: string;
  directionOverride?: 'ENTRY' | 'EXIT';
  offlineStatus: 'OFFLINE_OVERRIDE' | 'OFFLINE_DENY_LOGGED';
  reason?: string;
}

const OFFLINE_STORAGE_KEY = 'offlineGateScans';

function getOfflineQueue(): OfflineScanEntry[] {
  try {
    const raw = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (!raw) return [];
    // Decode from base64 to prevent casual plaintext exposure of tokens
    return JSON.parse(atob(raw));
  } catch {
    // If decoding fails (e.g. old unencoded data), clear and start fresh
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
    return [];
  }
}

function saveOfflineQueue(queue: OfflineScanEntry[]) {
  // Encode as base64 to prevent casual plaintext exposure of QR tokens/passcodes
  localStorage.setItem(OFFLINE_STORAGE_KEY, btoa(JSON.stringify(queue)));
}

interface ScanResponse {
  verdict: 'ALLOW' | 'DENY';
  scanResult: string;
  student?: { name: string; block?: string };
  leaveType?: string;
  returnBy?: string;
  reason?: string;
}

interface VerifyResponse {
  valid: boolean;
  student?: {
    name: string;
    email: string;
    block?: string;
    roomNumber?: string;
  };
  leave?: {
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    reason: string;
  };
  pass?: {
    status: string;
    lastGateState: string;
    expiresAt: string;
  };
  allowEntry: boolean;
  allowExit: boolean;
  reason?: string;
}

type InputMode = 'camera' | 'token';

export default function ScanPage() {
  const { user, logout } = useAuth();
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [verifyResult, setVerifyResult] = useState<VerifyResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyingSlow, setVerifyingSlow] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [passCodeInput, setPassCodeInput] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [showPassCodeHint, setShowPassCodeHint] = useState(false);
  const [directionOverride, setDirectionOverride] = useState<'ENTRY' | 'EXIT' | null>(null);
  const [offlineCount, setOfflineCount] = useState(() => getOfflineQueue().length);
  const [syncing, setSyncing] = useState(false);
  const [showOverrideSheet, setShowOverrideSheet] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const lastScanRef = useRef<string>('');
  const lastOfflineTokenRef = useRef<{ qrToken?: string; passCode?: string }>({});
  const verdictTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVerify = useCallback(async (qrToken?: string, passCode?: string) => {
    if (verifying) return;
    setVerifying(true);
    setVerifyingSlow(false);
    setVerifyResult(null);

    // Show "Still verifying..." after 1.5s
    slowTimeoutRef.current = setTimeout(() => setVerifyingSlow(true), 1500);

    // Timeout at 3s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const body: Record<string, string> = {};
      if (qrToken) body.qrToken = qrToken;
      if (passCode) body.passCode = passCode;
      if (directionOverride) body.directionOverride = directionOverride;

      const res = await apiFetch<ScanResponse>('/gate/validate', {
        method: 'POST',
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      if (slowTimeoutRef.current) clearTimeout(slowTimeoutRef.current);

      setScanData(res.data);
      setVerdict(res.data.verdict);

      // Haptic feedback
      if (res.data.verdict === 'ALLOW') {
        navigator.vibrate?.(100);
        // Auto-return after 1.2s
        verdictTimeoutRef.current = setTimeout(() => {
          setVerdict(null);
          setScanData(null);
          lastScanRef.current = '';
        }, 1200);
      } else {
        navigator.vibrate?.([100, 50, 100]);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      if (slowTimeoutRef.current) clearTimeout(slowTimeoutRef.current);

      if (err instanceof DOMException && err.name === 'AbortError') {
        lastOfflineTokenRef.current = { qrToken, passCode };
        setVerdict('OFFLINE');
        setScanData({ verdict: 'DENY', scanResult: 'NETWORK_UNVERIFIED', reason: 'Request timed out' });
      } else if (err instanceof ApiError) {
        setVerdict('DENY');
        setScanData({ verdict: 'DENY', scanResult: err.code, reason: err.message });
      } else {
        lastOfflineTokenRef.current = { qrToken, passCode };
        setVerdict('OFFLINE');
        setScanData({ verdict: 'DENY', scanResult: 'NETWORK_UNVERIFIED', reason: 'Network error' });
      }
      navigator.vibrate?.([100, 50, 100]);
    } finally {
      setVerifying(false);
      setVerifyingSlow(false);
      setDirectionOverride(null);
    }
  }, [verifying, directionOverride]);

  // Verify token for preview (read-only, does not log scan)
  const handleTokenVerify = useCallback(async () => {
    if (!tokenInput.trim()) return;
    setVerifyLoading(true);
    setVerifyResult(null);
    try {
      const res = await apiFetch<VerifyResponse>(`/gate-passes/verify/${encodeURIComponent(tokenInput.trim())}`);
      setVerifyResult(res.data);
    } catch (err) {
      setVerifyResult({
        valid: false,
        allowEntry: false,
        allowExit: false,
        reason: err instanceof Error ? err.message : 'Verification failed',
      });
    } finally {
      setVerifyLoading(false);
    }
  }, [tokenInput]);

  // Log entry/exit for a verified token
  const handleLogDirection = useCallback(async (direction: 'ENTRY' | 'EXIT') => {
    if (!tokenInput.trim()) return;
    setDirectionOverride(direction);
    await handleVerify(tokenInput.trim());
    setTokenInput('');
    setVerifyResult(null);
  }, [tokenInput, handleVerify]);

  // Start camera — deferred to ensure DOM element has layout dimensions
  useEffect(() => {
    if (inputMode !== 'camera') return;

    let scanner: Html5Qrcode | null = null;
    let cancelled = false;
    let startTimeout: ReturnType<typeof setTimeout> | null = null;

    // Defer scanner init to next frame so the #qr-reader div has layout
    startTimeout = setTimeout(() => {
      if (cancelled) return;

      const el = document.getElementById('qr-reader');
      if (!el || el.offsetWidth === 0) {
        setCameraError('Camera not available — verify by passCode or token');
        return;
      }

      try {
        scanner = new Html5Qrcode('qr-reader');
      } catch {
        setCameraError('Camera not available — verify by passCode or token');
        return;
      }

      scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (cancelled || decodedText === lastScanRef.current) return;
          lastScanRef.current = decodedText;
          setShowPassCodeHint(false);
          void handleVerify(decodedText);
        },
        () => { /* ignore scan failures */ },
      ).then(() => {
        if (!cancelled) {
          hintTimeoutRef.current = setTimeout(() => setShowPassCodeHint(true), 5000);
        }
      }).catch(() => {
        if (!cancelled) {
          setCameraError('Camera not available — verify by passCode or token');
        }
      });
    }, 100);

    return () => {
      cancelled = true;
      if (startTimeout) clearTimeout(startTimeout);
      if (verdictTimeoutRef.current) clearTimeout(verdictTimeoutRef.current);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      if (slowTimeoutRef.current) clearTimeout(slowTimeoutRef.current);
      if (longPressRef.current) clearTimeout(longPressRef.current);
      scanner?.stop().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputMode]);

  const handlePassCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passCodeInput.length === 6) {
      void handleVerify(undefined, passCodeInput);
      setPassCodeInput('');
    }
  };

  const handleDirectionLongPress = () => {
    longPressRef.current = setTimeout(() => {
      const current = directionOverride;
      const next = current === 'ENTRY' ? null : current === 'EXIT' ? null : undefined;
      if (next === undefined) {
        // No override set — prompt for which direction
        const choice = window.confirm('Override next scan to ENTRY?\n\n(OK = ENTRY, Cancel = EXIT)');
        setDirectionOverride(choice ? 'ENTRY' : 'EXIT');
      } else {
        setDirectionOverride(null);
      }
    }, 600);
  };

  const cancelLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const handleOfflineAction = (offlineStatus: 'OFFLINE_OVERRIDE' | 'OFFLINE_DENY_LOGGED') => {
    const entry: OfflineScanEntry = {
      scanAttemptId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...lastOfflineTokenRef.current,
      scannedAt: new Date().toISOString(),
      directionOverride: directionOverride ?? undefined,
      offlineStatus,
    };
    const queue = getOfflineQueue();
    queue.push(entry);
    saveOfflineQueue(queue);
    setOfflineCount(queue.length);
    dismissVerdict();
  };

  const flushOfflineQueue = async () => {
    if (syncing) return;
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    setSyncing(true);
    const remaining: OfflineScanEntry[] = [];
    for (const entry of queue) {
      try {
        await apiFetch('/gate/reconcile', {
          method: 'POST',
          body: JSON.stringify(entry),
        });
      } catch {
        remaining.push(entry);
      }
    }
    saveOfflineQueue(remaining);
    setOfflineCount(remaining.length);
    setSyncing(false);
  };

  // Auto-sync on reconnection
  useEffect(() => {
    const onOnline = () => { void flushOfflineQueue(); };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const OVERRIDE_REASONS = ['Medical Emergency', 'Family Emergency', 'Staff Instruction', 'Other'];

  const handleOverrideOpen = () => {
    setShowOverrideSheet(true);
    setOverrideReason('');
    setOverrideNote('');
  };

  const handleOverrideSubmit = async () => {
    if (!overrideReason || overrideNote.length < 5) return;
    try {
      await apiFetch('/gate/override', {
        method: 'POST',
        body: JSON.stringify({
          reason: overrideReason,
          note: overrideNote,
          method: 'MANUAL_OVERRIDE',
        }),
      });
      setShowOverrideSheet(false);
      setScanData({ verdict: 'ALLOW', scanResult: 'OVERRIDE', reason: `Override — ${overrideReason}` });
      setVerdict('ALLOW');
      showSuccess('Override approved');
      navigator.vibrate?.(100);
      verdictTimeoutRef.current = setTimeout(() => {
        setVerdict(null);
        setScanData(null);
        lastScanRef.current = '';
      }, 1200);
    } catch (err) {
      showError(err, 'Override submission failed');
    }
  };

  const dismissVerdict = () => {
    if (verdictTimeoutRef.current) clearTimeout(verdictTimeoutRef.current);
    setVerdict(null);
    setScanData(null);
    setShowOverrideSheet(false);
    lastScanRef.current = '';
  };

  // Verdict overlay
  if (verdict) {
    const isAllow = verdict === 'ALLOW';
    const isOffline = verdict === 'OFFLINE';
    const bgColor = isAllow ? 'bg-green-700' : isOffline ? 'bg-amber-600' : 'bg-red-700';
    const label = isAllow ? 'ALLOW' : isOffline ? 'OFFLINE' : 'DENY';

    return (
      <div className={`fixed inset-0 ${bgColor} flex flex-col items-center justify-center text-white z-50`} onClick={dismissVerdict}>
        <p className="text-5xl font-bold mb-4">{label}</p>
        {scanData?.student && (
          <p className="text-2xl font-semibold">{scanData.student.name}</p>
        )}
        {scanData?.student?.block && (
          <p className="text-lg opacity-80">Block {scanData.student.block}</p>
        )}
        {isAllow && scanData?.leaveType && (
          <p className="text-sm mt-4 opacity-80">
            {scanData.leaveType} — Return by {scanData.returnBy ? new Date(scanData.returnBy).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'N/A'}
          </p>
        )}
        {!isAllow && scanData?.scanResult && (
          <p className="text-sm mt-4 opacity-80">{scanData.scanResult.replace(/_/g, ' ')}</p>
        )}
        {isOffline && (
          <div className="mt-8 flex flex-col gap-3 w-64">
            <button
              onClick={(e) => { e.stopPropagation(); handleOfflineAction('OFFLINE_OVERRIDE'); }}
              className="px-6 py-3 bg-green-600 rounded-lg text-lg font-medium"
            >
              Override to Allow
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleOfflineAction('OFFLINE_DENY_LOGGED'); }}
              className="px-6 py-3 bg-white/20 rounded-lg text-lg font-medium"
            >
              Deny (Log Attempt)
            </button>
          </div>
        )}
        {!isAllow && !isOffline && (
          <div className="mt-8 flex flex-col gap-3 w-64">
            <button
              onClick={(e) => { e.stopPropagation(); handleOverrideOpen(); }}
              className="px-6 py-3 bg-yellow-600 rounded-lg text-lg font-medium"
            >
              Override
            </button>
            <button
              onClick={dismissVerdict}
              className="px-6 py-3 bg-white/20 rounded-lg text-lg font-medium"
            >
              Dismiss
            </button>
          </div>
        )}
        {/* Override bottom sheet */}
        {showOverrideSheet && (
          <div
            className="fixed bottom-0 left-0 right-0 bg-gray-900 rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-semibold mb-4">Override — Select Reason</p>
            <div className="flex flex-col gap-2 mb-4">
              {OVERRIDE_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setOverrideReason(r);
                    const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                    setOverrideNote(`${r} — allowed at ${time}`);
                  }}
                  className={`px-4 py-3 rounded-lg text-left text-sm font-medium ${
                    overrideReason === r ? 'bg-yellow-600' : 'bg-white/10'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            {overrideReason && (
              <>
                <textarea
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white text-sm mb-4"
                  placeholder="Note (min 5 characters)"
                />
                <button
                  onClick={() => void handleOverrideSubmit()}
                  disabled={overrideNote.length < 5}
                  className="w-full px-6 py-3 bg-green-600 rounded-lg text-lg font-medium disabled:opacity-40"
                >
                  Confirm Override
                </button>
              </>
            )}
            <button
              onClick={() => setShowOverrideSheet(false)}
              className="w-full mt-3 px-6 py-3 bg-white/10 rounded-lg text-sm"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    );
  }

  // Verifying spinner
  if (verifying) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col items-center justify-center text-white z-50">
        <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mb-4" />
        <p className="text-lg">{verifyingSlow ? 'Still verifying...' : 'Verifying...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <Reveal duration={0.2}>
      <div className="flex items-center justify-between p-3 bg-black/80 text-white z-10">
        <div>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs opacity-60">Guard</p>
        </div>
        <div
          className={`px-3 py-1.5 rounded text-xs font-mono select-none ${directionOverride ? 'bg-yellow-600' : 'bg-white/10'}`}
          onTouchStart={handleDirectionLongPress}
          onTouchEnd={cancelLongPress}
          onTouchCancel={cancelLongPress}
          onMouseDown={handleDirectionLongPress}
          onMouseUp={cancelLongPress}
          onMouseLeave={cancelLongPress}
        >
          {directionOverride ? `Override: ${directionOverride}` : 'Auto'}
        </div>
        <button
          onClick={() => void logout()}
          className="px-3 py-1.5 rounded bg-white/10 text-sm"
        >
          Logout
        </button>
      </div>
      </Reveal>

      {/* Input mode tabs */}
      <div className="flex bg-gray-900 border-b border-gray-700">
        <button
          onClick={() => { setInputMode('camera'); setVerifyResult(null); }}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            inputMode === 'camera'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-white/50'
          }`}
        >
          Camera Scan
        </button>
        <button
          onClick={() => setInputMode('token')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            inputMode === 'token'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-white/50'
          }`}
        >
          Token / PassCode
        </button>
      </div>

      {/* Offline sync indicator */}
      {offlineCount > 0 && (
        <div className="flex items-center justify-between px-3 py-2 bg-amber-700 text-white text-sm">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" />
            {offlineCount} offline scan{offlineCount > 1 ? 's' : ''} pending
          </span>
          <button
            onClick={() => void flushOfflineQueue()}
            disabled={syncing}
            className="px-3 py-1 rounded bg-white/20 text-xs font-medium disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}

      {inputMode === 'camera' && (
        <>
          {/* Camera or fallback */}
          <div className="flex-1 relative">
            {cameraError ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-white">
                <p className="text-center mb-6">{cameraError}</p>
              </div>
            ) : (
              <div id="qr-reader" className="w-full h-full" />
            )}
          </div>

          {/* PassCode input */}
          {(cameraError || showPassCodeHint) && (
            <div className="p-4 bg-gray-900">
              {showPassCodeHint && !cameraError && (
                <p className="text-white/60 text-sm text-center mb-2">Having trouble? Enter PassCode manually</p>
              )}
              <form onSubmit={handlePassCodeSubmit} className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={passCodeInput}
                  onChange={(e) => setPassCodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit PassCode"
                  className="flex-1 px-4 py-3.5 rounded-lg bg-white text-black text-lg text-center font-mono tracking-widest"
                />
                <button
                  type="submit"
                  disabled={passCodeInput.length !== 6}
                  className="px-6 py-3.5 rounded-lg bg-blue-600 text-white font-medium disabled:opacity-40"
                >
                  Verify
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {inputMode === 'token' && (
        <Reveal duration={0.2} delay={0.05}>
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
          {/* QR Token input */}
          <div className="space-y-2">
            <label className="text-white/70 text-sm font-medium">QR Token</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => { setTokenInput(e.target.value); setVerifyResult(null); }}
                placeholder="Paste or type scanned QR token..."
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white text-sm font-mono placeholder:text-white/30"
              />
              <button
                onClick={() => void handleTokenVerify()}
                disabled={!tokenInput.trim() || verifyLoading}
                className="px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-40"
              >
                {verifyLoading ? '...' : 'Check'}
              </button>
            </div>
          </div>

          {/* PassCode input */}
          <div className="space-y-2">
            <label className="text-white/70 text-sm font-medium">PassCode</label>
            <form onSubmit={handlePassCodeSubmit} className="flex gap-2">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={passCodeInput}
                onChange={(e) => setPassCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="6-digit PassCode"
                className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white text-lg text-center font-mono tracking-widest placeholder:text-white/30"
              />
              <button
                type="submit"
                disabled={passCodeInput.length !== 6}
                className="px-5 py-3 rounded-lg bg-blue-600 text-white text-sm font-medium disabled:opacity-40"
              >
                Verify
              </button>
            </form>
          </div>

          {/* Verification result card */}
          {verifyResult && (
            <div className={`rounded-xl border-2 overflow-hidden ${
              verifyResult.valid
                ? 'border-green-500 bg-green-900/20'
                : 'border-red-500 bg-red-900/20'
            }`}>
              {/* Status bar */}
              <div className={`px-4 py-2 flex items-center gap-2 ${
                verifyResult.valid ? 'bg-green-600' : 'bg-red-600'
              }`}>
                <span className={`w-3 h-3 rounded-full ${
                  verifyResult.valid ? 'bg-green-300' : 'bg-red-300'
                }`} />
                <span className="text-white font-semibold text-sm">
                  {verifyResult.valid ? 'VALID PASS' : 'INVALID PASS'}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Student info */}
                {verifyResult.student && (
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold shrink-0">
                      {verifyResult.student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{verifyResult.student.name}</p>
                      <p className="text-white/60 text-sm">
                        {verifyResult.student.block && `Block ${verifyResult.student.block}`}
                        {verifyResult.student.roomNumber && ` / Room ${verifyResult.student.roomNumber}`}
                      </p>
                    </div>
                  </div>
                )}

                {/* Leave details */}
                {verifyResult.leave && (
                  <div className="bg-white/5 rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Leave Type</span>
                      <span className="text-white font-medium">{verifyResult.leave.type.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">From</span>
                      <span className="text-white font-medium">
                        {new Date(verifyResult.leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">To</span>
                      <span className="text-white font-medium">
                        {new Date(verifyResult.leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Leave Status</span>
                      <span className="text-white font-medium">{verifyResult.leave.status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Reason</span>
                      <span className="text-white font-medium text-right max-w-[60%]">{verifyResult.leave.reason}</span>
                    </div>
                  </div>
                )}

                {/* Pass status */}
                {verifyResult.pass && (
                  <div className="bg-white/5 rounded-lg p-3 space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Pass Status</span>
                      <span className={`font-medium ${
                        verifyResult.pass.status === 'ACTIVE' ? 'text-green-400' :
                        verifyResult.pass.status === 'EXPIRED' ? 'text-red-400' :
                        verifyResult.pass.status === 'USED' ? 'text-blue-400' :
                        'text-white/60'
                      }`}>{verifyResult.pass.status}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Gate State</span>
                      <span className="text-white font-medium">{verifyResult.pass.lastGateState}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Expires</span>
                      <span className="text-white font-medium">
                        {new Date(verifyResult.pass.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                )}

                {/* Reason for invalid */}
                {verifyResult.reason && !verifyResult.valid && (
                  <p className="text-red-400 text-sm">{verifyResult.reason}</p>
                )}

                {/* Action buttons */}
                {verifyResult.valid && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => void handleLogDirection('EXIT')}
                      disabled={!verifyResult.allowExit}
                      className="flex-1 py-3 rounded-lg bg-orange-600 text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Log Exit
                    </button>
                    <button
                      onClick={() => void handleLogDirection('ENTRY')}
                      disabled={!verifyResult.allowEntry}
                      className="flex-1 py-3 rounded-lg bg-green-600 text-white font-semibold text-sm disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Log Entry
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hidden QR reader div needed for Html5Qrcode initialization */}
          <div id="qr-reader" className="hidden" />
        </div>
        </Reveal>
      )}
    </div>
  );
}
