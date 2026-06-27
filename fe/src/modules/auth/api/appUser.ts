import { apiGet } from '@core/api/client';
import { User } from '@core/types';
import { authClient } from '../auth-client';
import { getAccessToken, setAccessToken } from '../auth-token';
import { ApiUser, mapUser } from '../api/userMapping';

export async function syncAccessToken(): Promise<void> {
  const { data, error } = await authClient.token();
  if (error || !data?.token) {
    throw new Error('Gagal mendapatkan token sesi. Coba masuk lagi.');
  }
  setAccessToken(data.token);
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
