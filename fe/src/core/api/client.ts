import { requestApi } from './axiosClient';

export async function apiRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase() as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  return requestApi<T>(method, path, options.body);
}

export const apiGet = <T>(path: string) => requestApi<T>('GET', path);
export const apiPost = <T>(path: string, body?: unknown) => requestApi<T>('POST', path, body);
export const apiPut = <T>(path: string, body: unknown) => requestApi<T>('PUT', path, body);
export const apiPatch = <T>(path: string, body: unknown) => requestApi<T>('PATCH', path, body);
export const apiDelete = <T>(path: string) => requestApi<T>('DELETE', path);
