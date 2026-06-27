import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User } from '@core/types';
import { clearAllDraftsForUser } from '@core/draft/draftStorage';
import { GOOGLE_AUTH_ENABLED } from '../constants';
import { AuthContext, AuthContextValue } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { setAccessToken, setUnauthorizedHandler } from '../auth-token';

type AuthProviderProps = {
  children: React.ReactNode;
  onLogout?: () => void;
};

export function AuthProvider({ children, onLogout }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      try {
        const sessionUser = await authService.restoreSession();
        if (!cancelled) {
          setUser(sessionUser);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
      setAccessToken(null);
      onLogout?.();
    });
    return () => setUnauthorizedHandler(null);
  }, [onLogout]);

  const loginWithEmail = useCallback(async (email: string, password: string): Promise<User> => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const loggedInUser = await authService.loginWithEmail(email, password);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login gagal. Coba lagi.');
      throw err;
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string): Promise<User> => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const registeredUser = await authService.signUpWithEmail(name, email, password);
      setUser(registeredUser);
      return registeredUser;
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Pendaftaran gagal. Coba lagi.');
      throw err;
    } finally {
      setLoginLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setLoginError(null);
    try {
      await authService.loginWithGoogle();
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login Google gagal.');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    if (user?.id) {
      clearAllDraftsForUser(user.id);
    }
    try {
      await authService.logout();
    } catch {
      /* tetap keluar meski API gagal */
    } finally {
      setUser(null);
      onLogout?.();
    }
  }, [user, onLogout]);

  const clearLoginError = useCallback(() => setLoginError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      setUser,
      isLoading,
      loginLoading,
      loginError,
      googleEnabled: GOOGLE_AUTH_ENABLED,
      loginWithEmail,
      signUpWithEmail,
      loginWithGoogle,
      logout,
      clearLoginError,
    }),
    [
      user,
      isLoading,
      loginLoading,
      loginError,
      loginWithEmail,
      signUpWithEmail,
      loginWithGoogle,
      logout,
      clearLoginError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
