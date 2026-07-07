import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config';
import { getAccessToken, notifyUnauthorized } from '@modules/auth/auth-token';
import { withNetworkRetry } from '@core/net/lowSignal';

const REQUEST_TIMEOUT_MS = 20_000;
const UPLOAD_TIMEOUT_MS = 90_000;

type ApiEnvelope<T> = { data: T };
type ApiErrorEnvelope = { error: { code: string; message: string } };

export const apiAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

apiAxios.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiAxios.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && getAccessToken()) {
      notifyUnauthorized();
    }
    return Promise.reject(error);
  },
);

function mapAxiosError(err: unknown): Error {
  if (err instanceof Error && !axios.isAxiosError(err)) {
    return err;
  }
  const axiosErr = err as AxiosError<ApiErrorEnvelope>;
  if (axiosErr.code === 'ECONNABORTED') {
    return new Error('Koneksi lambat — coba lagi sebentar. Pastikan sinyal cukup stabil.');
  }
  if (!axiosErr.response) {
    return new Error('Tidak bisa terhubung ke server. Periksa sinyal internet lalu coba lagi.');
  }
  const message = axiosErr.response.data?.error?.message;
  if (message) {
    return new Error(message);
  }
  return new Error(axiosErr.response.statusText || 'Permintaan API gagal');
}

export async function apiUpload<T>(
  path: string,
  file: File,
  fields?: Record<string, string>,
): Promise<T> {
  const form = new FormData();
  form.append('file', file);
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      form.append(key, value);
    }
  }
  try {
    const response = await apiAxios.post(path, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: UPLOAD_TIMEOUT_MS,
    });
    return unwrapData<T>(response.data);
  } catch (err) {
    throw mapAxiosError(err);
  }
}

export async function openAuthenticatedFile(path: string) {
  const response = await apiAxios.get(path, { responseType: 'blob' });
  const objectUrl = URL.createObjectURL(response.data);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
}

function unwrapData<T>(body: unknown): T {
  if (body === undefined || body === null || body === '') {
    throw new Error('Server mengembalikan respons kosong. Pastikan backend aktif (make run-be).');
  }
  if (typeof body === 'object' && body !== null && 'data' in body) {
    return (body as ApiEnvelope<T>).data;
  }
  throw new Error('Respons server tidak valid. Pastikan backend aktif (make run-be).');
}

export async function requestApi<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
): Promise<T> {
  const run = async () => {
    const response = await apiAxios.request({
      method,
      url: path,
      data: body,
    });
    return unwrapData<T>(response.data);
  };

  try {
    // ponytail: GET di-retry otomatis — sinyal pelosok sering putus sebentar
    if (method === 'GET') {
      return await withNetworkRetry(run, { retries: 2, baseDelayMs: 1_000 });
    }
    return await run();
  } catch (err) {
    throw mapAxiosError(err);
  }
}
