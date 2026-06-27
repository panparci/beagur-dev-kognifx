import { apiPost } from '@core/api/client';
import { User, UserRole } from '@core/types';
import { ApiUser, mapUser } from '../api/userMapping';

export async function chooseOnboardingRole(role: UserRole): Promise<User> {
  if (role === UserRole.ADMIN) {
    throw new Error('Peran admin tidak dapat dipilih dari onboarding publik.');
  }
  const data = await apiPost<ApiUser>('/api/v1/onboarding/choose-role', { role });
  return mapUser(data);
}
