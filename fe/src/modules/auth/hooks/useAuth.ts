import { createContext, useContext } from 'react';
import { User } from '@core/types';

export type AuthContextValue = {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  loginLoading: boolean;
  loginError: string | null;
  googleEnabled: boolean;
  loginWithEmail: (email: string, password: string) => Promise<User>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearLoginError: () => void;
};

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
