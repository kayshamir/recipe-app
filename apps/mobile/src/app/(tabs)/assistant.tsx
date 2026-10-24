import { router } from 'expo-router';
import { Body, Button, Screen } from '@/components/foundation';
import { useSession } from '@/features/auth/session';
export default function Assistant() {
  const { token } = useSession();
  return (
    <Screen title="Cooking assistant" topInset>
      <Body>The assistant is coming soon. A verified account will be required.</Body>
      {token ? (
        <Button label="Conversation history" onPress={() => router.push('/history')} />
      ) : (
        <Button label="Sign in" onPress={() => router.push('/sign-in')} />
      )}
    </Screen>
  );
}
