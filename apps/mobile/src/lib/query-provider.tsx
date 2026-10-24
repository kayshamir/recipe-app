import {
  QueryClient,
  QueryClientProvider,
  focusManager,
  onlineManager,
} from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { AppState, Platform } from 'react-native';

export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60000, retry: 1 },
          mutations: { retry: false },
        },
      }),
  );
  useEffect(() => {
    const apply = (state: Network.NetworkState) =>
      onlineManager.setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    const network = Network.addNetworkStateListener(apply);
    void Network.getNetworkStateAsync()
      .then(apply)
      .catch(() => undefined);
    const app = AppState.addEventListener('change', (state) => {
      if (Platform.OS !== 'web') focusManager.setFocused(state === 'active');
      if (state === 'active')
        void Network.getNetworkStateAsync()
          .then(apply)
          .catch(() => undefined);
    });
    return () => {
      network.remove();
      app.remove();
    };
  }, []);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
