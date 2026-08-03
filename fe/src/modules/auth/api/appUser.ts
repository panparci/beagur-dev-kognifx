import { apiGet } from '@core/api/client';
import { User } from '@core/types';
import { getAccessToken } from '../auth-token';
import { refreshAccessToken } from '../refreshAccessToken';
import { ApiUser, mapUser } from '../api/userMapping';

export async function syncAccessToken(): Promise<void> {
  await refreshAccessToken();
}

export async function fetchAppUser(): Promise<User | null> {
  if (!getAccessToken()) {
    await syncAccessToken();
  }
  try {
    const data = await apiGet<ApiUser>('/api/v1/me');
    return mapUser(data);
  } catch {
    return null;
  }
}
