import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AccountStatus } from '@core/types';
import { onVisibleOnlineInterval } from '@core/net/lowSignal';
import { resolvePostAuthPath } from '@core/routing/authRedirect';
import { authService } from '../services/authService';
import { useAuth } from './useAuth';

/** Cek status akun berkala (tanpa WebSocket) — hemat kuota, hanya tab aktif + online. */
const POLL_MS = 90_000;

export function usePendingAccountPoll(enabled: boolean) {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();

  useEffect(() => {
    if (!enabled || !user) return;

    const check = async () => {
      const fresh = await authService.refreshAppUser();
      if (!fresh) return;
      setUser(fresh);
      if (fresh.accountStatus !== AccountStatus.PENDING_VERIFICATION) {
        navigate(resolvePostAuthPath(fresh), { replace: true });
      }
    };

    void check();
    return onVisibleOnlineInterval(() => void check(), POLL_MS);
  }, [enabled, user?.id, navigate, setUser]);
}
