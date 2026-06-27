import React, { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@modules/auth/hooks/useAuth';
import {
  OVERVIEW_TAB_SLUG,
  PORTAL_BASE_PATH,
  SLUG_BY_TAB,
  resolveTabFromSlug,
} from './tabRoutes';

type PortalTabGuardProps = {
  children: React.ReactNode;
};

/** Validates `:tabSlug` against the signed-in role and normalizes the URL. */
export function PortalTabGuard({ children }: PortalTabGuardProps) {
  const { tabSlug } = useParams<{ tabSlug?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const resolvedTab = user ? resolveTabFromSlug(tabSlug, user.role) : null;
  const expectedSlug = resolvedTab ? (SLUG_BY_TAB[resolvedTab] ?? OVERVIEW_TAB_SLUG) : OVERVIEW_TAB_SLUG;

  useEffect(() => {
    if (!user) return;
    if (!tabSlug) {
      navigate(`${PORTAL_BASE_PATH}/${expectedSlug}`, { replace: true });
      return;
    }
    if (tabSlug !== expectedSlug) {
      navigate(`${PORTAL_BASE_PATH}/${expectedSlug}`, { replace: true });
    }
  }, [user, tabSlug, expectedSlug, navigate]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!tabSlug || tabSlug !== expectedSlug) {
    return null;
  }

  return <>{children}</>;
}
