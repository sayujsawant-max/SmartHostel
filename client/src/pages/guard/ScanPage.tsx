import { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useAuth } from '@hooks/useAuth';
import { apiFetch, ApiError } from '@services/api';

type Verdict = 'ALLOW' | 'DENY' | 'OFFLINE' | null;

interface ScanResponse {
  verdict: 'ALLOW' | 'DENY';
  scanResult: string;
  student?: { name: string; block?: string };
  leaveType?: string;
  returnBy?: string;
  reason?: string;
}

export default function ScanPage() {
  const { user, logout } = useAuth();
  const [verdict, setVerdict] = useState<Verdict>(null);
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyingSlow, setVerifyingSlow] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [passCodeInput, setPassCodeInput] = useState('');
  const [showPassCodeHint, setShowPassCodeHint] = useState(false);
  const lastScanRef = useRef<string>('');
  const verdictTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleVerify = useCallback(async (qrToken?: string, passCode?: string) => {
    if (verifying) return;
    setVerifying(true);
    setVerifyingSlow(false);

    // Show "Still verifying..." after 1.5s
    slowTimeoutRef.current = setTimeout(() => setVerifyingSlow(true), 1500);

    // Timeout at 3s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    try {
      const body: Record<string, string> = {};
      if (qrToken) body.qrToken = qrToken;
      if (passCode) body.passCode = passCode;

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
        setVerdict('OFFLINE');
        setScanData({ verdict: 'DENY', scanResult: 'NETWORK_UNVERIFIED', reason: 'Request timed out' });
      } else if (err instanceof ApiError) {
        setVerdict('DENY');
        setScanData({ verdict: 'DENY', scanResult: err.code, reason: err.message });
      } else {
        setVerdict('OFFLINE');
        setScanData({ verdict: 'DENY', scanResult: 'NETWORK_UNVERIFIED', reason: 'Network error' });
      }
      navigator.vibrate?.([100, 50, 100]);
    } finally {
      setVerifying(false);
      setVerifyingSlow(false);
    }
  }, [verifying]);

  // Start camera
  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader');

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 280, height: 280 } },
      (decodedText) => {
        if (decodedText === lastScanRef.current) return;
        lastScanRef.current = decodedText;
        setShowPassCodeHint(false);
        void handleVerify(decodedText);
      },
      () => { /* ignore scan failures */ },
    ).then(() => {
      // Show passCode hint after 5s of no scan
      hintTimeoutRef.current = setTimeout(() => setShowPassCodeHint(true), 5000);
    }).catch(() => {
      setCameraError('Camera not available — verify by passCode');
    });

    return () => {
      if (verdictTimeoutRef.current) clearTimeout(verdictTimeoutRef.current);
      if (hintTimeoutRef.current) clearTimeout(hintTimeoutRef.current);
      if (slowTimeoutRef.current) clearTimeout(slowTimeoutRef.current);
      scanner.stop().catch(() => {});
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePassCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passCodeInput.length === 6) {
      void handleVerify(undefined, passCodeInput);
      setPassCodeInput('');
    }
  };

  const dismissVerdict = () => {
    if (verdictTimeoutRef.current) clearTimeout(verdictTimeoutRef.current);
    setVerdict(null);
    setScanData(null);
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
        {!isAllow && (
          <button
            onClick={dismissVerdict}
            className="mt-8 px-6 py-3 bg-white/20 rounded-lg text-lg font-medium"
          >
            Dismiss
          </button>
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
      <div className="flex items-center justify-between p-3 bg-black/80 text-white z-10">
        <div>
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs opacity-60">Guard</p>
        </div>
        <button
          onClick={() => void logout()}
          className="px-3 py-1.5 rounded bg-white/10 text-sm"
        >
          Logout
        </button>
      </div>

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
    </div>
  );
}
