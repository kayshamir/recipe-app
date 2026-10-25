import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import Storage from 'expo-sqlite/kv-store';

const completionKey = 'onboarding.completed.v1';
const welcomeKey = 'onboarding.welcome.completed.v1';
const devResetKey = 'onboarding.dev-reset.v1';

async function readCompletionState(): Promise<[boolean, boolean]> {
  if (__DEV__ && (await Storage.getItem(devResetKey)) !== 'done') {
    await Promise.all([
      Storage.removeItem(completionKey),
      Storage.removeItem(welcomeKey),
      Storage.setItem(devResetKey, 'done'),
    ]);
    return [false, false];
  }

  const [onboardingValue, welcomeValue] = await Promise.all([
    Storage.getItem(completionKey),
    Storage.getItem(welcomeKey),
  ]);
  return [onboardingValue === 'true', welcomeValue === 'true'];
}

type OnboardingState = {
  completed: boolean | null;
  welcomeCompleted: boolean | null;
  error: boolean;
  retry: () => void;
  reset: () => Promise<void>;
  finish: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
};

const OnboardingContext = createContext<OnboardingState | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [welcomeCompleted, setWelcomeCompleted] = useState<boolean | null>(null);
  const [error, setError] = useState(false);

  async function restore() {
    setError(false);
    try {
      const [onboardingComplete, welcomeComplete] = await readCompletionState();
      setCompleted(onboardingComplete);
      setWelcomeCompleted(welcomeComplete);
    } catch {
      setError(true);
    }
  }

  useEffect(() => {
    let active = true;
    void readCompletionState()
      .then(([onboardingComplete, welcomeComplete]) => {
        if (active) {
          setCompleted(onboardingComplete);
          setWelcomeCompleted(welcomeComplete);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <OnboardingContext.Provider
      value={{
        completed,
        welcomeCompleted,
        error,
        retry: () => void restore(),
        reset: async () => {
          await Promise.all([Storage.removeItem(completionKey), Storage.removeItem(welcomeKey)]);
          setCompleted(false);
          setWelcomeCompleted(false);
        },
        finish: async () => {
          await Promise.all([
            Storage.setItem(completionKey, 'true'),
            Storage.removeItem(welcomeKey),
          ]);
          setCompleted(true);
          setWelcomeCompleted(false);
        },
        continueAsGuest: async () => {
          await Storage.setItem(welcomeKey, 'true');
          setWelcomeCompleted(true);
        },
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding requires OnboardingProvider');
  return context;
}
