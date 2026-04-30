import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { HostelConfig, FeatureFlags } from '@smarthostel/shared';
import { apiFetch } from '@services/api';
import { hexToHslTriplet } from '@utils/hex-to-hsl';

interface HostelConfigContextValue {
  config: HostelConfig | null;
  loading: boolean;
  /** Re-fetch from /api/hostel-config — call after the warden saves changes. */
  refresh: () => Promise<void>;
  /** Push a freshly returned config (e.g. from the AI chat response) to skip a round-trip. */
  setConfig: (config: HostelConfig) => void;
  /** Convenience helper. Defaults to true while config is still loading. */
  isFeatureEnabled: (key: keyof FeatureFlags) => boolean;
}

const HostelConfigContext = createContext<HostelConfigContextValue | undefined>(undefined);

/**
 * Apply the branding hex colors to CSS variables on :root so anything using
 * hsl(var(--accent)) / hsl(var(--primary)) repaints immediately.
 */
function applyBranding(primaryHex: string, accentHex: string) {
  const root = document.documentElement;
  const primaryHsl = hexToHslTriplet(primaryHex);
  const accentHsl = hexToHslTriplet(accentHex);
  if (primaryHsl) root.style.setProperty('--primary', primaryHsl);
  if (accentHsl) {
    root.style.setProperty('--accent', accentHsl);
    root.style.setProperty('--ring', accentHsl);
  }
}

export function HostelConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<HostelConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const setConfig = useCallback((next: HostelConfig) => {
    setConfigState(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await apiFetch<{ config: HostelConfig }>('/hostel-config');
      setConfigState(res.data.config);
    } catch {
      // public endpoint shouldn't fail; if it does, leave the previous config in place.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // Apply branding whenever the config changes.
  useEffect(() => {
    if (!config) return;
    applyBranding(config.branding.primaryColor, config.branding.accentColor);
  }, [config]);

  // Reflect hostel name in the document title (page-specific titles via
  // usePageTitle prepend; this just keeps the suffix accurate).
  useEffect(() => {
    if (!config) return;
    const current = document.title;
    if (!current.includes(config.hostel.name)) {
      document.title = config.hostel.name;
    }
  }, [config]);

  const isFeatureEnabled = useCallback(
    (key: keyof FeatureFlags) => (config ? config.features[key] : true),
    [config],
  );

  return (
    <HostelConfigContext.Provider value={{ config, loading, refresh, setConfig, isFeatureEnabled }}>
      {children}
    </HostelConfigContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHostelConfig(): HostelConfigContextValue {
  const ctx = useContext(HostelConfigContext);
  if (!ctx) throw new Error('useHostelConfig must be used within HostelConfigProvider');
  return ctx;
}
