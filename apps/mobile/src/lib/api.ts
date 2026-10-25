import { create, isAxiosError } from 'axios';
import { tokenStore } from '@/features/auth/token-store';
import { config } from './config';

export const publicApi = create({ baseURL: config.apiUrl, timeout: 15000 });
export const authenticatedApi = create({ baseURL: config.apiUrl, timeout: 15000 });
for (const client of [publicApi, authenticatedApi]) {
  client.interceptors.request.use((request) => {
    if (!config.apiUrl) throw new Error('Configure EXPO_PUBLIC_API_URL before calling the API.');
    return request;
  });
}
authenticatedApi.interceptors.request.use(async (request) => {
  const token = await tokenStore.get();
  if (token) request.headers.Authorization = `Bearer ${token}`;
  return request;
});
export function apiErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    if (error.response?.status === 401) return 'Your session expired. Please sign in again.';
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
    if (!error.response) return 'Could not reach the server. Check your connection and try again.';
    return 'The server could not complete the request. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
