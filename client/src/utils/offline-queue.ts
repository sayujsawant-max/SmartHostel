import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import React from 'react';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const QUEUE_KEY = 'smarthostel-offline-queue';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface QueueItem {
  id: string;
  url: string;
  method: string;
  body?: string;
  headers?: Record<string, string>;
  timestamp: number;
}

/* ------------------------------------------------------------------ */
/*  OfflineQueue class                                                 */
/* ------------------------------------------------------------------ */

class OfflineQueue {
  private load(): QueueItem[] {
    try {
      const raw = localStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private save(items: QueueItem[]): void {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  }

  add(item: QueueItem): void {
    const items = this.load();
    items.push(item);
    this.save(items);
  }

  getAll(): QueueItem[] {
    return this.load();
  }

  remove(id: string): void {
    const items = this.load().filter((item) => item.id !== id);
    this.save(items);
  }

  clear(): void {
    localStorage.removeItem(QUEUE_KEY);
  }

  size(): number {
    return this.load().length;
  }
}

/* ------------------------------------------------------------------ */
/*  Singleton queue instance                                           */
/* ------------------------------------------------------------------ */

const queue = new OfflineQueue();

/* ------------------------------------------------------------------ */
/*  offlineFetch                                                       */
/* ------------------------------------------------------------------ */

async function offlineFetch(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const method = (options?.method ?? 'GET').toUpperCase();

  if (navigator.onLine) {
    try {
      return await fetch(url, options);
    } catch (err) {
      // Network error while supposedly online — queue non-GET requests
      if (method === 'GET') throw err;

      queue.add({
        id: crypto.randomUUID(),
        url,
        method,
        body: typeof options?.body === 'string' ? options.body : undefined,
        headers: options?.headers
          ? (Object.fromEntries(
              new Headers(options.headers as HeadersInit).entries(),
            ) as Record<string, string>)
          : undefined,
        timestamp: Date.now(),
      });

      return new Response(
        JSON.stringify({
          queued: true,
          message: "Saved for when you're back online",
        }),
        {
          status: 202,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }
  }

  // Offline
  if (method === 'GET') {
    throw new Error('Cannot perform GET requests while offline');
  }

  queue.add({
    id: crypto.randomUUID(),
    url,
    method,
    body: typeof options?.body === 'string' ? options.body : undefined,
    headers: options?.headers
      ? (Object.fromEntries(
          new Headers(options.headers as HeadersInit).entries(),
        ) as Record<string, string>)
      : undefined,
    timestamp: Date.now(),
  });

  return new Response(
    JSON.stringify({
      queued: true,
      message: "Saved for when you're back online",
    }),
    {
      status: 202,
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

/* ------------------------------------------------------------------ */
/*  syncQueue                                                          */
/* ------------------------------------------------------------------ */

async function syncQueue(): Promise<{ synced: number; failed: number }> {
  const items = queue.getAll();
  let synced = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        body: item.body,
        headers: item.headers,
      });

      if (res.ok) {
        queue.remove(item.id);
        synced++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { synced, failed };
}

/* ------------------------------------------------------------------ */
/*  useOfflineStatus hook                                              */
/* ------------------------------------------------------------------ */

function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueSize, setQueueSize] = useState(queue.size());

  const refreshQueueSize = useCallback(() => {
    setQueueSize(queue.size());
  }, []);

  const sync = useCallback(async () => {
    await syncQueue();
    refreshQueueSize();
  }, [refreshQueueSize]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      sync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      refreshQueueSize();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Poll queue size periodically for reactivity
    const interval = setInterval(refreshQueueSize, 3000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [sync, refreshQueueSize]);

  return { isOnline, queueSize, sync };
}

/* ------------------------------------------------------------------ */
/*  OfflineBanner component                                            */
/* ------------------------------------------------------------------ */

function OfflineBanner() {
  const { isOnline, queueSize, sync } = useOfflineStatus();
  const [syncing, setSyncing] = useState(false);
  const [justReconnected, setJustReconnected] = useState(false);
  const wasOfflineRef = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
    } else if (wasOfflineRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reconnect sync must trigger re-render
      setJustReconnected(true);
      setSyncing(true);

      sync().finally(() => {
        setSyncing(false);
        setTimeout(() => {
          setJustReconnected(false);
          wasOfflineRef.current = false;
        }, 3000);
      });
    }
  }, [isOnline, sync]);

  const showBanner = !isOnline || justReconnected;

  return React.createElement(
    AnimatePresence,
    null,
    showBanner
      ? React.createElement(
          motion.div,
          {
            key: 'offline-banner',
            initial: { height: 0, opacity: 0 },
            animate: { height: 'auto', opacity: 1 },
            exit: { height: 0, opacity: 0 },
            transition: spring,
            className: 'overflow-hidden',
          },
          React.createElement(
            'div',
            {
              className: isOnline
                ? 'flex items-center justify-center gap-2 bg-emerald-500 px-4 py-2 text-sm text-white dark:bg-emerald-600'
                : 'flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm text-amber-950 dark:bg-amber-600 dark:text-amber-50',
            },
            isOnline
              ? React.createElement(
                  React.Fragment,
                  null,
                  React.createElement(Wifi, { className: 'h-4 w-4' }),
                  React.createElement(
                    'span',
                    null,
                    syncing
                      ? `Back online! Syncing ${queueSize} item${queueSize !== 1 ? 's' : ''}...`
                      : 'Back online! All synced.',
                  ),
                  syncing
                    ? React.createElement(
                        motion.span,
                        {
                          animate: { rotate: 360 },
                          transition: {
                            repeat: Infinity,
                            duration: 1,
                            ease: 'linear',
                          },
                        },
                        React.createElement(RefreshCw, {
                          className: 'h-4 w-4',
                        }),
                      )
                    : null,
                )
              : React.createElement(
                  React.Fragment,
                  null,
                  React.createElement(WifiOff, { className: 'h-4 w-4' }),
                  React.createElement(
                    'span',
                    null,
                    "You're offline. Actions will be saved and synced when you reconnect.",
                  ),
                  queueSize > 0
                    ? React.createElement(
                        'span',
                        {
                          className:
                            'ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-950/20 px-1.5 text-[10px] font-bold dark:bg-amber-50/20',
                        },
                        queueSize,
                      )
                    : null,
                ),
          ),
        )
      : null,
  );
}

/* ------------------------------------------------------------------ */
/*  Exports                                                            */
/* ------------------------------------------------------------------ */

export { OfflineQueue, offlineFetch, syncQueue, useOfflineStatus, OfflineBanner };
