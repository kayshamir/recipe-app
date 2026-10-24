import { Image, type ImageProps } from 'expo-image';
import { View } from 'react-native';
import { Body } from './foundation';
import { tokens } from '@/constants/tokens';
/** Only approved, correctly matched images may be supplied by callers. */
export function RecipeImage({ source, accessibilityLabel, ...props }: ImageProps) {
  if (!source)
    return (
      <View style={{ padding: 24, backgroundColor: tokens.color.surface }}>
        <Body>Photo unavailable</Body>
      </View>
    );
  return (
    <Image
      {...props}
      source={source}
      accessibilityLabel={accessibilityLabel}
      accessible
      cachePolicy="memory-disk"
      contentFit="cover"
    />
  );
}
