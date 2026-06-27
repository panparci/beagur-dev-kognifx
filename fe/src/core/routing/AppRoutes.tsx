import React, { useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import {
  PORTAL_FOG_TIMING,
  type LoginTransitionPhase,
  markPortalEntryFromAuth,
  sleep,
} from '@core/routing/portalTransition';
import { PortalFogTransition } from '@core/ui/PortalFogTransition';
import { useAuth } from '@modules/auth/hooks/useAuth';
import { needsRoleSelection } from '@modules/auth/api/userMapping';
import LandingPage from '@modules/landing/components/LandingPage';
import AuthPage from '@modules/auth/components/AuthPage';
import { PendingVerificationPage } from '@modules/auth/components/PendingVerificationPage';
import { PortalRoute } from '@core/routing/PortalRoute';
import { NotFoundPage } from '@core/routing/NotFoundPage';
import { resolvePostAuthPath } from '@core/routing/authRedirect';
import { portalPathForTab } from '@core/routing/tabRoutes';
import { OVERVIEW_TAB } from '@core/constants/tabs';
import { AccountStatus, UserRole } from '@core/types';

function AuthenticatedRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (needsRoleSelection(user)) {
    return <Navigate to={portalPathForTab(OVERVIEW_TAB)} replace />;
  }
  if (
    user.accountStatus === AccountStatus.PENDING_VERIFICATION &&
    user.role === UserRole.VALIDATOR
  ) {
    return <Navigate to="/pending-verification" replace />;
  }
  return <Navigate to={resolvePostAuthPath(user)} replace />;
}

export function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    loginLoading,
    loginError,
    googleEnabled,
    loginWithEmail,
    signUpWithEmail,
    loginWithGoogle,
    clearLoginError,
  } = useAuth();
  const [loginTransition, setLoginTransition] = useState<LoginTransitionPhase>('idle');

  const afterAuth = async (authedUser: NonNullable<typeof user>) => {
    markPortalEntryFromAuth();
    setLoginTransition('cover');
    await sleep(PORTAL_FOG_TIMING.coverMs);
    navigate(resolvePostAuthPath(authedUser), { replace: true });
    setLoginTransition('reveal');
  };

  const handleLoginTransitionComplete = () => {
    setLoginTransition('idle');
  };

  const handleLoginWithEmail = async (email: string, password: string) => {
    try {
      const authed = await loginWithEmail(email, password);
      afterAuth(authed);
    } catch {
      /* error sudah di-set AuthProvider */
    }
  };

  const handleSignUp = async (name: string, email: string, password: string) => {
    try {
      const authed = await signUpWithEmail(name, email, password);
      afterAuth(authed);
    } catch {
      /* error sudah di-set AuthProvider */
    }
  };

  const fogMode = loginTransition === 'idle' ? 'hidden' : loginTransition;

  return (
    <div className="min-h-screen font-sans text-bea-ink">
      <PortalFogTransition
        mode={fogMode}
        layer="global"
        onComplete={handleLoginTransitionComplete}
      />

      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <AuthenticatedRedirect />
            ) : (
              <LandingPage onSwitchToAuth={() => navigate('/login')} />
            )
          }
        />
        <Route
          path="/login"
          element={
            user ? (
              <AuthenticatedRedirect />
            ) : (
              <AuthPage
                onLoginWithEmail={handleLoginWithEmail}
                onSignUpWithEmail={handleSignUp}
                onLoginWithGoogle={() => void loginWithGoogle()}
                onSwitchToLanding={() => {
                  clearLoginError();
                  navigate('/');
                }}
                loginLoading={loginLoading}
                loginError={loginError}
                googleEnabled={googleEnabled}
                authTransitioning={loginTransition === 'cover'}
              />
            )
          }
        />
        <Route
          path="/pending-verification"
          element={
            user ? (
              <PendingVerificationPage />
            ) : (
              <Navigate to="/login" replace state={{ from: location.pathname }} />
            )
          }
        />
        <Route path="/portal/:tabSlug?" element={<PortalRoute />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}
