import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';
import { usePWA } from '@hooks/usePWA';

const DISMISS_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 7;

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  const elapsed = Date.now() - dismissedAt;
  return elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(isDismissed);

  if (!isInstallable || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0, filter: 'blur(8px)' }}
        animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
        exit={{ y: 100, opacity: 0, filter: 'blur(8px)' }}
        transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
        className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-2xl glass-strong p-4 shadow-xl card-glow"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
            <Download className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[hsl(var(--foreground))]">
              Install SmartHostel
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Add to your home screen for a better experience
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={promptInstall}
            className="shrink-0 rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
          >
            Install
          </motion.button>

          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-lg p-1 text-[hsl(var(--muted-foreground))] transition-colors hover:text-[hsl(var(--foreground))]"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
