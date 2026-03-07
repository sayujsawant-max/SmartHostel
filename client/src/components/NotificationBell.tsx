import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@services/api';

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
      // silently fail
    }
  }, []);

  useEffect(() => {
    const tick = () => void fetchNotifications();
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1.5 rounded-lg hover:bg-[hsl(var(--muted))]"
        aria-label="Notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[hsl(var(--foreground))]">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 max-h-96 overflow-y-auto rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-lg">
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
                {notifications.slice(0, 20).map((n) => (
                  <button
                    key={n._id}
                    onClick={() => {
                      if (!n.isRead) void handleMarkRead(n._id);
                    }}
                    className={`w-full text-left p-3 border-b border-[hsl(var(--border))] last:border-0 ${
                      n.isRead ? 'opacity-60' : 'bg-blue-50/50'
                    }`}
                  >
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">{n.title}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">{n.body}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
