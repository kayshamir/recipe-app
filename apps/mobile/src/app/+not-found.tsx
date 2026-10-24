import { router } from 'expo-router';
import { Body, Button, Screen } from '@/components/foundation';
export default function NotFound() {
  return (
    <Screen title="Page not found">
      <Body>This link is unavailable. Return to discovery to continue.</Body>
      <Button label="Go to discovery" onPress={() => router.replace('/')} />
    </Screen>
  );
}
