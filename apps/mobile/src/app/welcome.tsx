import { useState } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/foundation';
import { tokens as t } from '@/constants/tokens';
import { useOnboarding } from '@/features/onboarding/state';

export default function Welcome() {
  const { continueAsGuest } = useOnboarding();
  const [error, setError] = useState(false);

  async function onContinueAsGuest() {
    setError(false);
    try {
      await continueAsGuest();
    } catch {
      setError(true);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.artwork}>
          <Image
            source={require('../../assets/images/onboarding/welcome_chef_illustration.webp')}
            style={styles.image}
            contentFit="contain"
            accessible={false}
          />
        </View>
        <View style={styles.panel}>
          <View style={styles.panelContent}>
            <View style={styles.intro}>
              <Text accessibilityRole="header" style={styles.title}>
                Welcome to your kitchen
              </Text>
              <Text style={styles.description}>
                Discover Filipino recipes, save the ones you love, and cook at your own pace.
              </Text>
            </View>
            <View style={styles.actions}>
              {error ? (
                <Text accessibilityRole="alert" style={styles.error}>
                  Could not save your choice. Please try again.
                </Text>
              ) : null}
              <Button label="Continue as guest" onPress={() => void onContinueAsGuest()} />
              <View style={styles.accountActions}>
                <Button
                  label="Create an account"
                  variant="secondary"
                  onPress={() => router.push('/create-account')}
                />
                <Pressable
                  accessibilityRole="link"
                  accessibilityLabel="Log in"
                  onPress={() => router.push('/sign-in')}
                  style={({ pressed }) => [styles.loginLink, pressed && styles.loginLinkPressed]}
                >
                  <Text style={styles.loginText}>Already have an account? Log in</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#D0CAFC' },
  scroll: { flex: 1, backgroundColor: '#D0CAFC' },
  content: {
    flexGrow: 1,
    backgroundColor: '#D0CAFC',
  },
  artwork: {
    flex: 1,
    minHeight: 280,
    maxHeight: 420,
    overflow: 'hidden',
    backgroundColor: '#D0CAFC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 18,
  },
  image: {
    width: '120%',
    height: '120%',
    transform: [{ translateX: 12 }, { translateY: 18 }],
  },
  panel: {
    flexGrow: 1,
    minHeight: 380,
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
    justifyContent: 'center',
    gap: 32,
  },
  intro: { alignItems: 'center', gap: 10 },
  title: {
    fontFamily: t.font.title,
    fontSize: 30,
    lineHeight: 39,
    textAlign: 'center',
    color: t.color.text,
  },
  description: {
    fontFamily: t.font.body,
    fontSize: 15,
    lineHeight: 23,
    maxWidth: 340,
    textAlign: 'center',
    color: t.color.text,
  },
  actions: { gap: 16 },
  accountActions: { gap: 4 },
  loginLink: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginLinkPressed: { opacity: 0.65 },
  loginText: { fontFamily: t.font.label, fontSize: 14, color: t.color.link },
  error: {
    fontFamily: t.font.body,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    color: t.color.error,
  },
});
