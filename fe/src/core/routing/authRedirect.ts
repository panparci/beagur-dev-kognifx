import { AccountStatus, User, UserRole } from '@core/types';
import { OVERVIEW_TAB } from '@core/constants/tabs';
import { portalPathForTab } from '@core/routing/tabRoutes';

const TEACHER_PROFILE_TAB = 'Pengajuan Profil';

/** Where to send the user right after login or role selection. */
export function resolvePostAuthPath(user: User): string {
  if (user.accountStatus === AccountStatus.NO_ROLE || user.role == null) {
    return portalPathForTab(OVERVIEW_TAB);
  }

  if (user.accountStatus === AccountStatus.PENDING_VERIFICATION) {
    if (user.role === UserRole.TEACHER) {
      return portalPathForTab(TEACHER_PROFILE_TAB);
    }
    return '/pending-verification';
  }

  switch (user.role) {
    case UserRole.TEACHER:
      return portalPathForTab(TEACHER_PROFILE_TAB);
    case UserRole.VALIDATOR:
    case UserRole.DONOR:
    case UserRole.ADMIN:
      return portalPathForTab(OVERVIEW_TAB);
    default:
      return portalPathForTab(OVERVIEW_TAB);
  }
}
