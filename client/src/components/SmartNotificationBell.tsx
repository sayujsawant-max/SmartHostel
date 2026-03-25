import { useCallback, useEffect, useState, useMemo } from 'react';
import { apiFetch } from '@services/api';
import { motion, AnimatePresence } from 'motion/react';
import { showError } from '@/utils/toast';
import { useSocket } from '@hooks/useSocket';
import { toast } from 'sonner';
import {
  Bell,
  BellOff,
  Filter,
  Check,
  CheckCheck,
  Trash2,
  Settings2,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  priority: 'LOW' | 'NORMAL' | 'URGENT';
}

type FilterTab = 'all' | 'unread' | 'urgent';

interface NotificationPrefs {
  batchLow: boolean;
  soundUrgent: boolean;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

const PREFS_KEY = 'smarthostel-notification-prefs';

const defaultPrefs: NotificationPrefs = {
  batchLow: true,
  soundUrgent: true,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return defaultPrefs;
}

function savePrefs(prefs: NotificationPrefs) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d >= today) return 'Today';
  if (d >= yesterday) return 'Yesterday';
  return 'Earlier';
}

function groupByDate(items: NotificationItem[]) {
  const groups: Record<string, NotificationItem[]> = {};
  for (const n of items) {
    const label = dateLabel(n.createdAt);
    (groups[label] ??= []).push(n);
  }
  return groups;
}

function playUrgentSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 880;
    gain.gain.value = 0.15;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  } catch {
    /* audio not available */
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SmartNotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<FilterTab>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [prefs, setPrefs] = useState<NotificationPrefs>(loadPrefs);
  const [dismissing, setDismissing] = useState<Set<string>>(new Set());

  /* ---- Fetch ---------------------------------------------------- */

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await apiFetch('/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch {
      showError('Failed to load notifications');
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  /* ---- WebSocket ------------------------------------------------ */

  useSocket('notification', useCallback((data: unknown) => {
    const n = data as NotificationItem;
    setNotifications((prev) => [n, ...prev]);

    if (n.priority === 'URGENT') {
      if (prefs.soundUrgent) playUrgentSound();
      toast.error(n.title, { description: n.body });
    }
  }, [prefs.soundUrgent]));

  /* ---- Mark read ------------------------------------------------ */

  const markRead = useCallback(
    async (id: string) => {
      setDismissing((prev) => new Set(prev).add(id));
      setTimeout(() => {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
        );
        setDismissing((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 300);

      try {
        await apiFetch(`/notifications/${id}/read`, { method: 'PATCH' });
      } catch {
        showError('Failed to mark as read');
      }
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await apiFetch('/notifications/read-all', { method: 'PATCH' });
    } catch {
      showError('Failed to mark all as read');
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    setDismissing((prev) => new Set(prev).add(id));
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      setDismissing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);

    try {
      await apiFetch(`/notifications/${id}`, { method: 'DELETE' });
    } catch {
      showError('Failed to delete notification');
    }
  }, []);

  /* ---- Prefs ---------------------------------------------------- */

  const updatePref = useCallback(
    (key: keyof NotificationPrefs, value: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: value };
        savePrefs(next);
        return next;
      });
    },
    [],
  );

  /* ---- Derived data --------------------------------------------- */

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const highestPriority = useMemo(() => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.some((n) => n.priority === 'URGENT')) return 'URGENT';
    if (unread.some((n) => n.priority === 'NORMAL')) return 'NORMAL';
    return 'LOW';
  }, [notifications]);

  const { filteredNormal, batchedLowCount, batchedLow } = useMemo(() => {
    let list = notifications;

    if (tab === 'unread') list = list.filter((n) => !n.isRead);
    if (tab === 'urgent') list = list.filter((n) => n.priority === 'URGENT');

    if (prefs.batchLow && tab !== 'urgent') {
      const normal = list.filter((n) => n.priority !== 'LOW');
      const low = list.filter((n) => n.priority === 'LOW');
      return { filteredNormal: normal, batchedLowCount: low.length, batchedLow: low };
    }

    return { filteredNormal: list, batchedLowCount: 0, batchedLow: [] as NotificationItem[] };
  }, [notifications, tab, prefs.batchLow]);

  const grouped = useMemo(() => groupByDate(filteredNormal), [filteredNormal]);

  const [lowExpanded, setLowExpanded] = useState(false);

  /* ---- Badge color ---------------------------------------------- */

  const badgeColor =
    highestPriority === 'URGENT'
      ? 'hsl(0 84% 60%)'
      : 'hsl(var(--primary))';

  /* ---- Tabs ----------------------------------------------------- */

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'urgent', label: 'Urgent' },
  ];

  /* ---- Render --------------------------------------------------- */

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--muted))]/60"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <motion.div
            animate={
              highestPriority === 'URGENT'
                ? { scale: [1, 1.2, 1] }
                : undefined
            }
            transition={
              highestPriority === 'URGENT'
                ? { repeat: Infinity, duration: 1.5 }
                : undefined
            }
          >
            <Bell className="h-5 w-5" />
          </motion.div>
        ) : (
          <BellOff className="h-5 w-5 opacity-50" />
        )}

        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={spring}
            className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold text-white"
            style={{ backgroundColor: badgeColor }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, scale: 0.96, filter: 'blur(6px)' }}
            transition={spring}
            className="absolute right-0 top-full z-50 mt-2 w-96 overflow-hidden rounded-2xl glass-strong shadow-xl card-glow"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[hsl(var(--border))] px-4 py-3">
              <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">
                Notifications
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setShowSettings((v) => !v)}
                  className="rounded-md p-1.5 text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                  title="Notification settings"
                >
                  <Settings2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Inline settings */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={spring}
                  className="overflow-hidden border-b border-[hsl(var(--border))]"
                >
                  <div className="space-y-2 px-4 py-3">
                    <label className="flex items-center justify-between text-xs text-[hsl(var(--foreground))]">
                      <span>Batch low-priority</span>
                      <button
                        onClick={() => updatePref('batchLow', !prefs.batchLow)}
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          prefs.batchLow
                            ? 'bg-[hsl(var(--primary))]'
                            : 'bg-[hsl(var(--muted))]'
                        }`}
                      >
                        <motion.span
                          layout
                          transition={spring}
                          className="absolute top-0.5 block h-4 w-4 rounded-full bg-white shadow"
                          style={{ left: prefs.batchLow ? '18px' : '2px' }}
                        />
                      </button>
                    </label>
                    <label className="flex items-center justify-between text-xs text-[hsl(var(--foreground))]">
                      <span>Sound for urgent</span>
                      <button
                        onClick={() =>
                          updatePref('soundUrgent', !prefs.soundUrgent)
                        }
                        className={`relative h-5 w-9 rounded-full transition-colors ${
                          prefs.soundUrgent
                            ? 'bg-[hsl(var(--primary))]'
                            : 'bg-[hsl(var(--muted))]'
                        }`}
                      >
                        <motion.span
                          layout
                          transition={spring}
                          className="absolute top-0.5 block h-4 w-4 rounded-full bg-white shadow"
                          style={{ left: prefs.soundUrgent ? '18px' : '2px' }}
                        />
                      </button>
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Filter tabs */}
            <div className="relative flex border-b border-[hsl(var(--border))]">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`relative flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                    tab === t.key
                      ? 'text-[hsl(var(--primary))]'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  {t.label}
                  {tab === t.key && (
                    <motion.div
                      layoutId="notification-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-[hsl(var(--primary))]"
                      transition={spring}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="max-h-[28rem] overflow-y-auto">
              {filteredNormal.length === 0 && batchedLowCount === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[hsl(var(--muted-foreground))]">
                  <Filter className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">
                    {tab === 'all' && 'No notifications yet'}
                    {tab === 'unread' && 'All caught up!'}
                    {tab === 'urgent' && 'No urgent notifications'}
                  </p>
                </div>
              ) : (
                <>
                  <AnimatePresence mode="popLayout">
                    {Object.entries(grouped).map(([label, items]) => (
                      <div key={label}>
                        <div className="sticky top-0 bg-[hsl(var(--card))]/95 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--muted-foreground))] backdrop-blur-sm">
                          {label}
                        </div>
                        {items.map((n) => (
                          <motion.div
                            key={n._id}
                            layout
                            initial={{ opacity: 0, x: -12 }}
                            animate={{
                              opacity: dismissing.has(n._id) ? 0 : 1,
                              x: dismissing.has(n._id) ? 40 : 0,
                            }}
                            exit={{ opacity: 0, x: 40, height: 0 }}
                            transition={spring}
                            className={`group relative border-b border-[hsl(var(--border))]/30 px-4 py-3 ${
                              n.isRead
                                ? 'opacity-60'
                                : 'bg-[hsl(var(--primary))]/5'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Priority indicator */}
                              <span
                                className={`mt-1.5 block h-2 w-2 shrink-0 rounded-full ${
                                  n.priority === 'URGENT'
                                    ? 'bg-[hsl(0_84%_60%)]'
                                    : n.priority === 'NORMAL'
                                      ? 'bg-[hsl(var(--primary))]'
                                      : 'bg-[hsl(var(--muted-foreground))]'
                                }`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                                  {n.title}
                                </p>
                                <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))] line-clamp-2">
                                  {n.body}
                                </p>
                                <p className="mt-1 text-[10px] text-[hsl(var(--muted-foreground))]/70">
                                  {new Date(n.createdAt).toLocaleTimeString(
                                    [],
                                    { hour: '2-digit', minute: '2-digit' },
                                  )}
                                </p>
                              </div>
                              {/* Hover actions */}
                              <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                {!n.isRead && (
                                  <button
                                    onClick={() => markRead(n._id)}
                                    className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
                                    title="Mark as read"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(n._id)}
                                  className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(0_84%_60%_/_0.1)] hover:text-[hsl(0_84%_60%)]"
                                  title="Delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ))}
                  </AnimatePresence>

                  {/* Batched low-priority section */}
                  {batchedLowCount > 0 && (
                    <div className="border-t border-[hsl(var(--border))]/30">
                      <button
                        onClick={() => setLowExpanded((v) => !v)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--muted))]/50"
                      >
                        <span>
                          {batchedLowCount} low-priority notification
                          {batchedLowCount !== 1 ? 's' : ''}
                        </span>
                        <motion.span
                          animate={{ rotate: lowExpanded ? 180 : 0 }}
                          transition={spring}
                          className="text-[10px]"
                        >
                          ▼
                        </motion.span>
                      </button>
                      <AnimatePresence>
                        {lowExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={spring}
                            className="overflow-hidden"
                          >
                            {batchedLow.map((n) => (
                              <motion.div
                                key={n._id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{
                                  opacity: dismissing.has(n._id) ? 0 : 0.7,
                                }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={spring}
                                className="group border-b border-[hsl(var(--border))]/20 px-4 py-2"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs text-[hsl(var(--foreground))]">
                                      {n.title}
                                    </p>
                                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                                      {n.body}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                    {!n.isRead && (
                                      <button
                                        onClick={() => markRead(n._id)}
                                        className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                                        title="Mark as read"
                                      >
                                        <Check className="h-3 w-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => deleteNotification(n._id)}
                                      className="rounded p-1 text-[hsl(var(--muted-foreground))] hover:text-[hsl(0_84%_60%)]"
                                      title="Delete"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  );
}
