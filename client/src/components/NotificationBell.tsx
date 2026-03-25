import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';
import { motion, AnimatePresence } from 'motion/react';
import { showError } from '@/utils/toast';
import { useSocket } from '@hooks/useSocket';
import { toast } from 'sonner';

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch {
      // Silently fail — this runs on a 30s poll; avoid spamming toasts
    }
  }, []);

  useEffect(() => {
    const tick = () => void fetchNotifications();
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Real-time: listen for new notifications via WebSocket
  useSocket('notification', (data) => {
    const n = data as NotificationItem;
    if (n && n._id) {
      setNotifications((prev) => [{ ...n, isRead: false }, ...prev]);
      setUnreadCount((c) => c + 1);
      // Show a push-style toast
      toast(n.title, { description: n.body, duration: 5000 });
    }
  });

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      showError(err, 'Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      showError(err, 'Failed to mark all as read');
    }
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--foreground))]">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-[badge-glow_2s_ease-in-out_infinite]"
            >
              <style>{`
                @keyframes badge-glow {
                  0%, 100% { box-shadow: 0 0 6px rgba(239,68,68,0.4); }
                  50% { box-shadow: 0 0 14px rgba(239,68,68,0.8); }
                }
              `}</style>
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, scale: 0.95, filter: 'blur(6px)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute right-0 top-10 z-50 w-80 max-h-96 overflow-y-auto rounded-2xl glass-strong shadow-xl card-glow"
            >
              <div className="flex justify-between items-center p-3 border-b border-[hsl(var(--border))]">
                <p className="text-sm font-semibold text-[hsl(var(--foreground))]">Notifications</p>
                {unreadCount > 0 && (
                  <button
                    onClick={() => void handleMarkAllRead()}
                    className="text-xs text-blue-600"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {notifications.length === 0 ? (
                <p className="p-4 text-sm text-[hsl(var(--muted-foreground))] text-center">No notifications</p>
              ) : (
                <div>
                  {notifications.slice(0, 20).map((n, idx) => (
                    <motion.button
                      key={n._id}
                      initial={{ opacity: 0, x: -10, filter: 'blur(4px)' }}
                      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                      transition={{ delay: idx * 0.03, duration: 0.3 }}
                      onClick={() => {
                        if (!n.isRead) void handleMarkRead(n._id);
                      }}
                      className={`w-full text-left p-3 border-b border-[hsl(var(--border))] last:border-0 transition-colors hover:bg-[hsl(var(--muted))] ${
                        n.isRead ? 'opacity-60' : 'bg-blue-50/50'
                      }`}
                    >
                      <p className="text-sm font-medium text-[hsl(var(--foreground))]">{n.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{n.body}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                        {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
