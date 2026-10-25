import { openBrowserAsync } from 'expo-web-browser';
export async function openSource(url: string) {
  if (new URL(url).protocol !== 'https:') throw new Error('Sources require HTTPS');
  return openBrowserAsync(url);
}
