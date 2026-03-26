import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@hooks/useAuth';

type EventHandler = (data: unknown) => void;

let globalSocket: Socket | null = null;
const listeners = new Map<string, Set<EventHandler>>();

function getSocket(userId: string): Socket {
  if (globalSocket?.connected) return globalSocket;

  globalSocket = io(window.location.origin, {
    path: '/ws',
    auth: { userId },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: 10,
  });

  globalSocket.on('connect', () => {
    console.debug('[WS] Connected');
  });

  globalSocket.on('disconnect', () => {
    console.debug('[WS] Disconnected');
  });

  // Forward events to registered listeners
  globalSocket.onAny((event: string, data: unknown) => {
    const handlers = listeners.get(event);
    if (handlers) {
      handlers.forEach(fn => fn(data));
    }
  });

  return globalSocket;
}

/** Hook to subscribe to real-time socket events */
export function useSocket(event: string, handler: EventHandler) {
  const { user } = useAuth();
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  const stableHandler = useCallback((data: unknown) => {
    handlerRef.current(data);
  }, []);

  useEffect(() => {
    if (!user) return;

    getSocket(user.id);

    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(stableHandler);

    return () => {
      listeners.get(event)?.delete(stableHandler);
      if (listeners.get(event)?.size === 0) {
        listeners.delete(event);
      }
    };
  }, [event, user, stableHandler]);
}

/** Disconnect the global socket (e.g., on logout) */
export function disconnectSocket() {
  globalSocket?.disconnect();
  globalSocket = null;
  listeners.clear();
}
