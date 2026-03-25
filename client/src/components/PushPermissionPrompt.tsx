import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell } from 'lucide-react';
import { usePushNotifications } from '@hooks/usePushNotifications';

const DISMISS_KEY = 'push-prompt-dismissed';
const DISMISS_DAYS = 3;

function isDismissed(): boolean {
  const raw = localStorage.getItem(DISMISS_KEY);
  if (!raw) return false;
  const dismissedAt = Number(raw);
  const elapsed = Date.now() - dismissedAt;
  return elapsed < DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

export default function PushPermissionPrompt() {
  const { isSupported, isSubscribed, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(isDismissed);

  if (!isSupported || isSubscribed || dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
        className="fixed bottom-4 right-4 z-50 w-80 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-lg"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
            <Bell className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[hsl(var(--foreground))]">
              Stay updated
            </p>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Enable push notifications to get important hostel updates instantly.
            </p>

            <div className="mt-3 flex gap-2">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={subscribe}
                className="rounded-xl bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-[hsl(var(--primary-foreground))] transition-colors hover:opacity-90"
              >
                Enable
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleDismiss}
                className="rounded-xl bg-[hsl(var(--muted))] px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] transition-colors hover:opacity-90"
              >
                Not now
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
