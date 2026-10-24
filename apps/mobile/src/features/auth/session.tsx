import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { tokenStore } from './token-store';
import { useQueryClient } from '@tanstack/react-query';

type AuthState = {
  token: string | null;
  restoring: boolean;
  error: boolean;
  restore: () => void;
  establishSession: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthState | null>(null);
export function SessionProvider({ children }: PropsWithChildren) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState(false);
  async function restore() {
    setRestoring(true);
    setError(false);
    try {
      setToken(await tokenStore.get());
    } catch {
      setError(true);
    } finally {
      setRestoring(false);
    }
  }
  useEffect(() => {
    let active = true;
    void tokenStore
      .get()
      .then((value) => {
        if (active) setToken(value);
      })
      .catch(() => {
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return (
    <AuthContext.Provider
      value={{
        token,
        restoring,
        error,
        restore: () => void restore(),
        establishSession: async (value) => {
          await tokenStore.set(value);
          setToken(value);
        },
        signOut: async () => {
          await tokenStore.clear();
          queryClient.clear();
          setToken(null);
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useSession() {
  const state = useContext(AuthContext);
  if (!state) throw new Error('useSession requires SessionProvider');
  return state;
}
