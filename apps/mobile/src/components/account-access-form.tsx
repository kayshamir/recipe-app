import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Body, Button, Input } from '@/components/foundation';
import { tokens as t } from '@/constants/tokens';

type AccountAccessFormProps = {
  mode: 'create' | 'login';
};

export function AccountAccessForm({ mode }: AccountAccessFormProps) {
  const creating = mode === 'create';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);

  function clearFeedback() {
    setFeedback(null);
  }

  function submit() {
    const cleanEmail = email.trim();
    if (!cleanEmail || !password || (creating && !confirmPassword)) {
      setFeedback({ message: 'Enter your email and password to continue.', error: true });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setFeedback({ message: 'Enter a valid email address.', error: true });
      return;
    }
    if (creating && password !== confirmPassword) {
      setFeedback({ message: 'Your passwords do not match.', error: true });
      return;
    }

    setFeedback({
      message: `Authentication is not connected yet. Your details have not been ${creating ? 'submitted' : 'sent'}.`,
      error: false,
    });
  }

  return (
    <View style={styles.form}>
      <Body>{creating ? 'Create an account with your email.' : 'Log in with your email.'}</Body>
      <Input
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          clearFeedback();
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoCorrect={false}
        returnKeyType="next"
      />
      <Input
        label="Password"
        value={password}
        onChangeText={(value) => {
          setPassword(value);
          clearFeedback();
        }}
        placeholder="Enter your password"
        secureTextEntry
        autoCapitalize="none"
        autoComplete={creating ? 'new-password' : 'current-password'}
        textContentType={creating ? 'newPassword' : 'password'}
        returnKeyType={creating ? 'next' : 'done'}
        onSubmitEditing={creating ? undefined : submit}
      />
      {creating ? (
        <Input
          label="Confirm password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            clearFeedback();
          }}
          placeholder="Re-enter your password"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
      ) : null}
      {feedback ? (
        <Text
          accessibilityRole={feedback.error ? 'alert' : undefined}
          accessibilityLiveRegion="polite"
          style={[styles.message, feedback.error ? styles.errorMessage : styles.statusMessage]}
        >
          {feedback.message}
        </Text>
      ) : null}
      <Button label={creating ? 'Create account' : 'Log in'} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  message: {
    fontFamily: t.font.body,
    fontSize: 13,
    lineHeight: 19,
  },
  errorMessage: { color: t.color.error },
  statusMessage: { color: t.color.secondary },
});
