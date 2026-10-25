import { useState } from 'react';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccountAccessForm } from '@/components/account-access-form';
import { Body, Button } from '@/components/foundation';
import { tokens as t } from '@/constants/tokens';
import { useOnboarding } from '@/features/onboarding/state';

export function AccountAccessScreen({ mode }: { mode: 'create' | 'login' }) {
  const { continueAsGuest } = useOnboarding();
  const [error, setError] = useState(false);
  const creating = mode === 'create';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              {creating ? 'Create an account' : 'Log in'}
            </Text>
          </View>
          <View style={styles.panel}>
            <View style={styles.panelContent}>
              <AccountAccessForm mode={mode} />
              {error ? <Body>Could not save your choice. Please try again.</Body> : null}
              <Button
                label="Continue as guest"
                variant="secondary"
                onPress={() => {
                  void continueAsGuest()
                    .then(() => router.replace('/'))
                    .catch(() => setError(true));
                }}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => router.back()}
                style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
              >
                <Text style={styles.backLabel}>Back to welcome</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#D0CAFC' },
  scroll: { flex: 1, backgroundColor: '#D0CAFC' },
  content: { flexGrow: 1, backgroundColor: '#D0CAFC' },
  header: {
    minHeight: 190,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 28,
  },
  title: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    fontFamily: t.font.title,
    fontSize: 30,
    lineHeight: 39,
    color: t.color.text,
  },
  panel: {
    flexGrow: 1,
    minHeight: 300,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 24,
  },
  panelContent: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    flexGrow: 1,
    gap: 20,
  },
  backButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  backLabel: { fontFamily: t.font.label, fontSize: 14, color: t.color.link },
  pressed: { opacity: 0.65 },
});
