import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const key = 'recipe-app.access-token';
// Browser preview deliberately uses memory, never localStorage.
let webToken: string | null = null;
export const tokenStore = {
  get: () => (Platform.OS === 'web' ? Promise.resolve(webToken) : SecureStore.getItemAsync(key)),
  set: async (token: string) => {
    if (Platform.OS === 'web') webToken = token;
    else await SecureStore.setItemAsync(key, token);
  },
  clear: async () => {
    if (Platform.OS === 'web') webToken = null;
    else await SecureStore.deleteItemAsync(key);
  },
};
