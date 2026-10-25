export function validateApiUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('EXPO_PUBLIC_API_URL must be an HTTP(S) URL without credentials.');
  }
  if (url.search || url.hash) throw new Error('API URL cannot contain a query or fragment.');
  return value.replace(/\/+$/, '');
}
export const config = { apiUrl: validateApiUrl(process.env.EXPO_PUBLIC_API_URL) };
