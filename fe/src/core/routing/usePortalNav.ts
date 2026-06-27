import { useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { OVERVIEW_TAB } from '@core/constants/tabs';
import { useAuth } from '@modules/auth/hooks/useAuth';
import { isPortalPath, portalPathForTab, resolveTabFromSlug } from './tabRoutes';

export function usePortalNav() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    if (!user || !isPortalPath(location.pathname)) {
      return OVERVIEW_TAB;
    }
    const slug = location.pathname.replace(/^\/portal\/?/, '').split('/')[0];
    return resolveTabFromSlug(slug || undefined, user.role);
  }, [user, location.pathname]);

  const setActiveTab = useCallback(
    (tab: string) => {
      navigate(portalPathForTab(tab));
    },
    [navigate],
  );

  return { activeTab, setActiveTab };
}
