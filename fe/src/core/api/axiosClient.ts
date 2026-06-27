import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config';
import { getAccessToken, notifyUnauthorized } from '@modules/auth/auth-token';

const REQUEST_TIMEOUT_MS = 12_000;

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
    return new Error('Server tidak merespons. Pastikan backend (make run-be) dan database aktif.');
  }
  if (!axiosErr.response) {
    return new Error('Tidak bisa terhubung ke server. Jalankan backend: make run-be');
  }
  const message = axiosErr.response.data?.error?.message;
  if (message) {
    return new Error(message);
  }
  return new Error(axiosErr.response.statusText || 'Permintaan API gagal');
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
  try {
    const response = await apiAxios.request({
      method,
      url: path,
      data: body,
    });
    return unwrapData<T>(response.data);
  } catch (err) {
    throw mapAxiosError(err);
  }
}
