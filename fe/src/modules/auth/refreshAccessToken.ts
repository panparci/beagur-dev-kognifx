import { authClient } from './auth-client';
import { setAccessToken } from './auth-token';

/** Single-flight: banyak 401 paralel hanya refresh JWT sekali. */
let inflight: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  if (!inflight) {
    inflight = (async () => {
      const { data, error } = await authClient.token();
      if (error || !data?.token) {
        throw new Error(error?.message ?? 'Gagal memperbarui token sesi');
      }
      setAccessToken(data.token);
      return data.token;
    })().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}
