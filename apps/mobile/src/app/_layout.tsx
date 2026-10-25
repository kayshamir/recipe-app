import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Body, Button, Loading, Screen } from '@/components/foundation';
import { SessionProvider, useSession } from '@/features/auth/session';
import { OnboardingProvider, useOnboarding } from '@/features/onboarding/state';
import { QueryProvider } from '@/lib/query-provider';
void SplashScreen.preventAutoHideAsync().catch(() => undefined);
export { ErrorBoundary } from 'expo-router';
export const unstable_settings = { anchor: 'welcome' };

function Navigation() {
  const { token, restoring, error, restore } = useSession();
  const onboarding = useOnboarding();
  if (
    restoring ||
    (onboarding.completed === null && !onboarding.error) ||
    (onboarding.welcomeCompleted === null && !onboarding.error)
  )
    return (
      <Screen title="Recipe App">
        <Loading label="Restoring session…" />
      </Screen>
    );
  if (error)
    return (
      <Screen title="Could not restore session">
        <Body>Secure storage is unavailable. Please try again.</Body>
        <Button label="Try again" onPress={restore} />
      </Screen>
    );
  if (onboarding.error)
    return (
      <Screen title="Could not open onboarding">
        <Body>Local storage is unavailable. Please try again.</Body>
        <Button label="Try again" onPress={onboarding.retry} />
      </Screen>
    );
  return (
    <Stack>
      <Stack.Protected guard={!onboarding.completed}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!onboarding.completed && !onboarding.welcomeCompleted}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!onboarding.completed && !!onboarding.welcomeCompleted}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Protected guard={!!token}>
          <Stack.Screen name="(account)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Screen name="recipe/[id]" options={{ title: 'Recipe' }} />
        <Stack.Screen name="cooking/[id]" options={{ title: 'Cooking' }} />
        <Stack.Screen name="search" options={{ title: 'Search' }} />
        <Stack.Screen name="downloads" options={{ title: 'Downloads' }} />
        <Stack.Screen name="report" options={{ title: 'Report' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Not found' }} />
      </Stack.Protected>
      <Stack.Protected guard={!!onboarding.completed && !token}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="create-account" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
export default function RootLayout() {
  const [loaded, error] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  useEffect(() => {
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <QueryProvider>
        <SessionProvider>
          <OnboardingProvider key="onboarding-dev-reset-once">
            <StatusBar style="dark" />
            <Navigation />
          </OnboardingProvider>
        </SessionProvider>
      </QueryProvider>
    </SafeAreaProvider>
  );
}
