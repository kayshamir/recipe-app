import { useState } from 'react';
import { router } from 'expo-router';
import { Body, Button, Screen } from '@/components/foundation';
import { useSession } from '@/features/auth/session';
import { useOnboarding } from '@/features/onboarding/state';
export default function Profile() {
  const { token, signOut } = useSession();
  const { reset } = useOnboarding();
  const [error, setError] = useState(false);
  const [onboardingError, setOnboardingError] = useState(false);

  async function replayOnboarding() {
    setOnboardingError(false);
    try {
      await reset();
      router.replace('/onboarding');
    } catch {
      setOnboardingError(true);
    }
  }

  return (
    <Screen title={token ? 'Your account' : 'Welcome, guest'} topInset>
      <Body>Recipe discovery, local favorites, and shopping lists do not require an account.</Body>
      {error && <Body>Could not sign out. Please try again.</Body>}
      {onboardingError && <Body>Could not reset onboarding. Please try again.</Body>}
      <Button
        label={token ? 'Sign out' : 'Sign in'}
        onPress={() => {
          if (token) void signOut().catch(() => setError(true));
          else router.push('/sign-in');
        }}
      />
      <Button
        label="Replay onboarding"
        onPress={() => void replayOnboarding()}
      />
    </Screen>
  );
}
