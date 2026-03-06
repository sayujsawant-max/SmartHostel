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

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Always clear client state even if server call fails
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
