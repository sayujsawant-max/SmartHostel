// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePWA } from './usePWA';

describe('usePWA', () => {
  let originalServiceWorker: ServiceWorkerContainer;
  let originalMatchMedia: typeof window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();

    // Save originals
    originalServiceWorker = navigator.serviceWorker;
    originalMatchMedia = window.matchMedia;

    // Mock matchMedia to not be in standalone mode by default
    window.matchMedia = vi.fn().mockReturnValue({ matches: false });

    // Mock navigator.serviceWorker
    Object.defineProperty(navigator, 'serviceWorker', {
      value: {
        register: vi.fn().mockResolvedValue({}),
      },
      writable: true,
      configurable: true,
    });

    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      value: true,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: originalServiceWorker,
      writable: true,
      configurable: true,
    });
    window.matchMedia = originalMatchMedia;
    vi.restoreAllMocks();
  });

  it('registers service worker on mount', () => {
    renderHook(() => usePWA());
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
  });

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isOffline).toBe(false);
  });

  it('captures beforeinstallprompt event and sets isInstallable', () => {
    const { result } = renderHook(() => usePWA());

    const promptEvent = new Event('beforeinstallprompt');
    Object.assign(promptEvent, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    expect(result.current.isInstallable).toBe(true);
  });

  it('promptInstall calls prompt and handles accepted outcome', async () => {
    const { result } = renderHook(() => usePWA());

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const promptEvent = new Event('beforeinstallprompt');
    Object.assign(promptEvent, {
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it('promptInstall handles dismissed outcome', async () => {
    const { result } = renderHook(() => usePWA());

    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const promptEvent = new Event('beforeinstallprompt');
    Object.assign(promptEvent, {
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'dismissed' as const }),
    });

    act(() => {
      window.dispatchEvent(promptEvent);
    });

    await act(async () => {
      await result.current.promptInstall();
    });

    expect(mockPrompt).toHaveBeenCalled();
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.isInstallable).toBe(false);
  });

  it('promptInstall does nothing when no deferred prompt', async () => {
    const { result } = renderHook(() => usePWA());

    // No beforeinstallprompt fired, so promptInstall should be a no-op
    await act(async () => {
      await result.current.promptInstall();
    });

    expect(result.current.isInstalled).toBe(false);
  });

  it('tracks offline status via online/offline events', () => {
    const { result } = renderHook(() => usePWA());

    expect(result.current.isOffline).toBe(false);

    act(() => {
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOffline).toBe(true);

    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(result.current.isOffline).toBe(false);
  });

  it('sets isInstalled on appinstalled event', () => {
    const { result } = renderHook(() => usePWA());

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it('detects standalone mode on mount', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    const { result } = renderHook(() => usePWA());

    expect(result.current.isInstalled).toBe(true);
  });

  it('handles missing serviceWorker gracefully', () => {
    Object.defineProperty(navigator, 'serviceWorker', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    // Should not throw
    const { result } = renderHook(() => usePWA());
    expect(result.current.isInstallable).toBe(false);
  });

  it('handles service worker registration failure gracefully', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (navigator.serviceWorker.register as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Registration failed'),
    );

    renderHook(() => usePWA());

    // Should not throw — error is caught internally
    consoleErrorSpy.mockRestore();
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => usePWA());
    unmount();

    const removedEvents = removeEventListenerSpy.mock.calls.map((call) => call[0]);
    expect(removedEvents).toContain('beforeinstallprompt');
    expect(removedEvents).toContain('appinstalled');
    expect(removedEvents).toContain('online');
    expect(removedEvents).toContain('offline');
  });
});
