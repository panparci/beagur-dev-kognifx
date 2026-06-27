import { AccountStatus, User, UserRole } from '@core/types';

const VALID_ROLES = new Set<string>(Object.values(UserRole));

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role?: string;
  accountStatus?: string;
};

export function mapUser(data: ApiUser): User {
  const roleRaw = data.role?.trim();
  const role =
    roleRaw && VALID_ROLES.has(roleRaw) ? (roleRaw as UserRole) : null;
  const statusRaw = data.accountStatus?.trim();
  const accountStatus =
    statusRaw && Object.values(AccountStatus).includes(statusRaw as AccountStatus)
      ? (statusRaw as AccountStatus)
      : role
        ? AccountStatus.ACTIVE
        : AccountStatus.NO_ROLE;

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    role,
    accountStatus,
  };
}

export function needsRoleSelection(user: User): boolean {
  return user.accountStatus === AccountStatus.NO_ROLE || user.role == null;
}

export function isPendingVerification(user: User): boolean {
  return user.accountStatus === AccountStatus.PENDING_VERIFICATION;
}
