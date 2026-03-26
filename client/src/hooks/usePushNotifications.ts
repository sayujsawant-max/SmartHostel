import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@services/api';

const STORAGE_KEY = 'push-subscribed';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
}

export function usePushNotifications(): UsePushNotificationsReturn {
  const isSupported =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  const [isSubscribed, setIsSubscribed] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  // Sync state with actual subscription on mount
  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((sub) => {
        const subscribed = sub !== null;
        setIsSubscribed(subscribed);
        localStorage.setItem(STORAGE_KEY, String(subscribed));
      });
    });
  }, [isSupported]);

  const subscribe = useCallback(async () => {
    if (!isSupported) return;

    const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error('VITE_VAPID_PUBLIC_KEY is not set');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
    });

    await apiFetch('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });

    setIsSubscribed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!isSupported) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }

    setIsSubscribed(false);
    localStorage.setItem(STORAGE_KEY, 'false');
  }, [isSupported]);

  return { isSupported, isSubscribed, subscribe, unsubscribe };
}
