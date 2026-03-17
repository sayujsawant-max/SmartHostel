import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch, AUTH_REFRESH_FAILED_EVENT } from '@services/api';
import { AuthContext, type UserProfile } from './auth-context-value';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ user: UserProfile }>('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  // Listen for refresh-failure signal to clear auth state
  useEffect(() => {
    function handleRefreshFailed() {
      setUser(null);
    }
    window.addEventListener(AUTH_REFRESH_FAILED_EVENT, handleRefreshFailed);
    return () => {
      window.removeEventListener(AUTH_REFRESH_FAILED_EVENT, handleRefreshFailed);
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<UserProfile> => {
    const res = await apiFetch<{ user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, gender: string, academicYear: string): Promise<UserProfile> => {
    const res = await apiFetch<{ user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, gender, academicYear }),
    });
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Always clear client state even if server call fails
    }
    setUser(null);
  }, []);

  const setConsented = useCallback(() => {
    setUser((prev) => (prev ? { ...prev, hasConsented: true } : prev));
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await apiFetch<{ user: UserProfile }>('/auth/me');
      setUser(res.data.user);
    } catch {
      // Silently fail — user state remains unchanged
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        setConsented,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
