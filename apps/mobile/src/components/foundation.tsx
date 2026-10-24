import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens as t } from '@/constants/tokens';
export function Screen({
  title,
  children,
  topInset = false,
}: PropsWithChildren<{ title: string; topInset?: boolean }>) {
  return (
    <SafeAreaView
      style={styles.safe}
      edges={topInset ? ['top', 'left', 'right', 'bottom'] : ['left', 'right', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={[styles.content, topInset && styles.tabContent]}
          keyboardShouldPersistTaps="handled"
        >
          <Text accessibilityRole="header" style={styles.title}>
            {title}
          </Text>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
export function Body({ children }: PropsWithChildren) {
  return <Text style={styles.body}>{children}</Text>;
}
export function Card({ children }: PropsWithChildren) {
  return <View style={styles.card}>{children}</View>;
}
export function Button({
  label,
  onPress,
  disabled = false,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'secondary' && styles.secondaryButton,
        (disabled || pressed) && { opacity: 0.6 },
      ]}
    >
      <Text style={[styles.buttonLabel, variant === 'secondary' && styles.secondaryButtonLabel]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Input({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: t.space.small }}>
      <Text style={styles.body}>{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        placeholderTextColor={t.color.secondary}
        style={[styles.input, props.style]}
      />
    </View>
  );
}
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label} style={styles.card}>
      <ActivityIndicator color={t.color.link} />
      <Body>{label}</Body>
    </View>
  );
}
export function Placeholder({
  title,
  description,
  topInset = false,
}: {
  title: string;
  description: string;
  topInset?: boolean;
}) {
  return (
    <Screen title={title} topInset={topInset}>
      <Body>{description}</Body>
      <Card>
        <Body>This feature is coming in a future update.</Body>
      </Card>
    </Screen>
  );
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.color.background },
  content: {
    padding: t.space.large,
    gap: t.space.large,
    width: '100%',
    maxWidth: t.maxWidth,
    alignSelf: 'center',
    flexGrow: 1,
  },
  tabContent: { paddingTop: t.space.small },
  title: { fontFamily: t.font.title, fontSize: 30, color: t.color.text },
  body: { fontFamily: t.font.body, fontSize: 16, lineHeight: 26, color: t.color.secondary },
  card: {
    padding: t.space.large,
    backgroundColor: t.color.surface,
    borderRadius: t.radius,
    gap: t.space.medium,
  },
  button: {
    backgroundColor: t.color.primary,
    minHeight: 48,
    padding: t.space.medium,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontFamily: t.font.label, fontSize: 16, color: t.color.text },
  secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: t.color.link },
  secondaryButtonLabel: { color: t.color.link },
  input: {
    minHeight: 48,
    padding: t.space.medium,
    borderWidth: 1,
    borderColor: t.color.secondary,
    borderRadius: t.radius,
    fontFamily: t.font.body,
    color: t.color.text,
    fontSize: 16,
  },
});
