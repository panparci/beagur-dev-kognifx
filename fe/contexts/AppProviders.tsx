import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider } from '@modules/auth/providers/AuthProvider';
import { useAuth } from '@modules/auth/hooks/useAuth';
import { AppLoadingScreen } from '@core/ui/AppLoadingScreen';

type AppProvidersProps = {
  children: React.ReactNode;
};

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  if (isLoading) {
    return <AppLoadingScreen />;
  }
  return <>{children}</>;
}

export function AppProviders({ children }: AppProvidersProps) {
  const navigate = useNavigate();
  const handleLogout = useCallback(() => {
    navigate('/', { replace: true });
  }, [navigate]);

  return (
    <AuthProvider onLogout={handleLogout}>
      <AuthGate>{children}</AuthGate>
    </AuthProvider>
  );
}
