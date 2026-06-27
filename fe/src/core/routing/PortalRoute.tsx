import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@modules/auth/hooks/useAuth';
import { needsRoleSelection } from '@modules/auth/api/userMapping';
import { ChooseRoleModal } from '@modules/auth/components/ChooseRoleModal';
import { PortalOnboardingBackdrop } from '@modules/auth/components/PortalOnboardingBackdrop';
import { AccountStatus, UserRole } from '@core/types';
import { resolvePostAuthPath } from '@core/routing/authRedirect';
import PortalDashboard from '@core/routing/PortalDashboard';
import { PortalTabGuard } from '@core/routing/PortalTabGuard';
import { authService } from '@modules/auth/services/authService';
import { PAGE_META, SITE_DESCRIPTION, buildDocumentTitle } from '@core/constants/siteMeta';
import { usePageMeta } from '@core/hooks/usePageMeta';
import { PortalFogTransition, type PortalFogMode } from '@core/ui/PortalFogTransition';
import {
  PORTAL_FOG_EASE,
  PORTAL_FOG_TIMING,
  consumePortalEntryFromAuth,
  sleep,
} from '@core/routing/portalTransition';

export function PortalRoute() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const reduce = useReducedMotion();

  const needsRole = Boolean(user && needsRoleSelection(user));
  const [{ entryAnim, localFog }] = useState(() => consumePortalEntryFromAuth());
  const [view, setView] = useState<'onboarding' | 'dashboard'>(() =>
    needsRole ? 'onboarding' : 'dashboard',
  );
  const [fogMode, setFogMode] = useState<PortalFogMode>(() => (localFog ? 'reveal' : 'hidden'));

  usePageMeta(
    view === 'onboarding'
      ? PAGE_META.chooseRole
      : {
          title: buildDocumentTitle('Portal'),
          description: SITE_DESCRIPTION,
          noIndex: true,
        },
  );

  useEffect(() => {
    if (fogMode !== 'hidden') return;
    setView(needsRole ? 'onboarding' : 'dashboard');
  }, [needsRole, fogMode]);

  const handleFogComplete = () => {
    if (fogMode === 'reveal' || fogMode === 'uncover') {
      setFogMode('hidden');
    }
  };

  const handleRoleComplete = async () => {
    if (reduce) {
      const refreshed = await authService.refreshAppUser();
      if (!refreshed) return;
      setUser(refreshed);
      navigate(resolvePostAuthPath(refreshed), { replace: true });
      return;
    }

    setFogMode('cover');
    await sleep(PORTAL_FOG_TIMING.roleCoverMs);

    const refreshed = await authService.refreshAppUser();
    if (!refreshed) {
      setFogMode('hidden');
      return;
    }

    setUser(refreshed);
    setView('dashboard');
    navigate(resolvePostAuthPath(refreshed), { replace: true });
    setFogMode('uncover');
    await sleep(PORTAL_FOG_TIMING.roleUncoverMs);
    setFogMode('hidden');
  };

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (
    view === 'dashboard' &&
    user.accountStatus === AccountStatus.PENDING_VERIFICATION &&
    user.role === UserRole.VALIDATOR
  ) {
    return <Navigate to="/pending-verification" replace />;
  }

  const entryTransition = reduce
    ? undefined
    : {
        duration: PORTAL_FOG_TIMING.revealMs / 1000,
        ease: PORTAL_FOG_EASE,
        delay: entryAnim ? 0.12 : 0,
      };

  return (
    <>
      <PortalFogTransition mode={fogMode} onComplete={handleFogComplete} />

      <AnimatePresence mode="wait">
        {view === 'onboarding' ? (
          <motion.div
            key="onboarding"
            className="portal-onboarding-screen"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0, filter: 'blur(6px)' }}
            transition={{ duration: 0.45, ease: PORTAL_FOG_EASE }}
          >
            <motion.div
              className="portal-onboarding-scene"
              initial={
                reduce || !entryAnim
                  ? false
                  : { filter: 'blur(28px) saturate(1.05)', scale: 1.06 }
              }
              animate={{ filter: 'blur(14px) saturate(1.05)', scale: 1.04 }}
              transition={entryTransition}
            >
              <PortalOnboardingBackdrop />
            </motion.div>
            <ChooseRoleModal onComplete={handleRoleComplete} animateIn={entryAnim} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            className="portal-dashboard-scene"
            initial={
              reduce || !entryAnim ? false : { opacity: 0, filter: 'blur(18px)' }
            }
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={reduce ? undefined : { opacity: 0, filter: 'blur(8px)' }}
            transition={entryTransition ?? { duration: 0.75, ease: PORTAL_FOG_EASE }}
          >
            <PortalTabGuard>
              <PortalDashboard role={user.role!} />
            </PortalTabGuard>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
