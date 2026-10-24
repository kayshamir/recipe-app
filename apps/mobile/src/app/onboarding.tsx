import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  interpolate,
  interpolateColor,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { tokens as t } from '@/constants/tokens';
import { useOnboarding } from '@/features/onboarding/state';

const slides = [
  {
    title: 'Discover your next dish',
    description: 'Find dishes that fit your tastes and pantry.',
    image: require('../../assets/images/onboarding/discover_recipes_onboarding.webp'),
    background: '#D0CAFC',
  },
  {
    title: 'Save what you love',
    description: 'Keep favorite recipes ready for later.',
    image: require('../../assets/images/onboarding/save_what_you_love_onboarding.webp'),
    background: '#FFE2CC',
  },
  {
    title: 'Cook with confidence',
    description: 'Follow clear steps from prep to plate.',
    image: require('../../assets/images/onboarding/cook_with_ease_onboarding.webp'),
    background: '#E5F8D9',
  },
] as const;

const backgrounds = slides.map((slide) => slide.background);

function ProgressDot({
  position,
  width,
  offset,
  reduceMotion,
}: {
  position: number;
  width: number;
  offset: SharedValue<number>;
  reduceMotion: boolean;
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const page = offset.value / width;
    const distance = Math.abs(page - position);
    const active = Math.round(page) === position;
    return {
      width: reduceMotion
        ? active
          ? 22
          : 8
        : interpolate(distance, [0, 1], [22, 8], Extrapolation.CLAMP),
      opacity: reduceMotion
        ? active
          ? 1
          : 0.38
        : interpolate(distance, [0, 1], [1, 0.38], Extrapolation.CLAMP),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
}

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const offset = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  const { finish } = useOnboarding();
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(false);

  const onScroll = useAnimatedScrollHandler((event) => {
    offset.value = event.contentOffset.x;
  });

  const backgroundStyle = useAnimatedStyle(() => {
    const page = offset.value / width;
    return {
      backgroundColor: reduceMotion
        ? backgrounds[Math.max(0, Math.min(2, Math.round(page)))]
        : interpolateColor(page, [0, 1, 2], backgrounds),
    };
  });

  const dotsStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? offset.value / width < 1.5
        ? 1
        : 0
      : interpolate(offset.value / width, [1, 1.7, 2], [1, 1, 0], Extrapolation.CLAMP),
  }));

  const actionStyle = useAnimatedStyle(() => ({
    opacity: reduceMotion
      ? offset.value / width < 1.5
        ? 0
        : 1
      : interpolate(offset.value / width, [1.7, 2], [0, 1], Extrapolation.CLAMP),
  }));

  function onPageChange(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(
      Math.max(
        0,
        Math.min(slides.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)),
      ),
    );
    setError(false);
  }

  async function onStartExploring() {
    setSaving(true);
    setError(false);
    try {
      await finish();
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Animated.View style={[styles.safe, backgroundStyle]}>
      <SafeAreaView style={styles.safe}>
        <StatusBar style="dark" />
        <Animated.ScrollView
          horizontal
          pagingEnabled
          removeClippedSubviews={false}
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onPageChange}
          scrollEnabled={!saving}
          style={styles.pages}
        >
          {slides.map((slide, slideIndex) => (
            <View key={slide.title} style={[styles.slide, { width }]}>
              <View style={styles.artwork}>
                <Image
                  source={slide.image}
                  style={[
                    styles.image,
                    slideIndex === 0 && styles.firstImage,
                    slideIndex === 2 && styles.lastImage,
                  ]}
                  contentFit="contain"
                  accessible={false}
                />
              </View>
              <View style={styles.copy}>
                <Text accessibilityRole="header" style={styles.title}>
                  {slide.title}
                </Text>
                <Text style={styles.description}>{slide.description}</Text>
              </View>
            </View>
          ))}
        </Animated.ScrollView>
        <View style={styles.footer}>
          <Animated.View
            style={[styles.dotsLayer, dotsStyle]}
            accessible={index < 2}
            accessibilityLabel={`Page ${index + 1} of ${slides.length}. Swipe left to continue.`}
            importantForAccessibility={index < 2 ? 'auto' : 'no-hide-descendants'}
          >
            <View style={styles.dots}>
              {slides.map((slide, dotIndex) => (
                <ProgressDot
                  key={slide.title}
                  position={dotIndex}
                  width={width}
                  offset={offset}
                  reduceMotion={reduceMotion}
                />
              ))}
            </View>
          </Animated.View>
          <Animated.View
            style={[styles.actionLayer, actionStyle]}
            pointerEvents={index === 2 ? 'auto' : 'none'}
            importantForAccessibility={index === 2 ? 'auto' : 'no-hide-descendants'}
          >
            {error ? (
              <Text accessibilityRole="alert" style={styles.error}>
                Could not save your progress. Try again.
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Explore recipes"
              accessibilityState={{ disabled: index !== 2 || saving }}
              disabled={index !== 2 || saving}
              onPress={() => void onStartExploring()}
              style={({ pressed }) => [styles.button, (pressed || saving) && styles.buttonPressed]}
            >
              <Text style={styles.buttonText}>
                {saving ? 'Opening recipes…' : 'Explore recipes'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pages: { flex: 1 },
  slide: { flex: 1, paddingHorizontal: 26, paddingTop: 14, paddingBottom: 4 },
  artwork: { flex: 1, minHeight: 0, alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  firstImage: { transform: [{ scale: 1.06 }] },
  lastImage: { transform: [{ scale: 1.2 }, { translateX: -12 }] },
  copy: { alignItems: 'center', gap: 10 },
  title: {
    fontFamily: t.font.title,
    fontSize: 29,
    lineHeight: 38,
    color: t.color.text,
    textAlign: 'center',
  },
  description: {
    fontFamily: t.font.body,
    fontSize: 15,
    lineHeight: 23,
    color: t.color.text,
    textAlign: 'center',
  },
  footer: { height: 100, justifyContent: 'center' },
  dotsLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 26,
    justifyContent: 'center',
    gap: 8,
  },
  dots: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 8, minHeight: 12 },
  dot: { height: 8, borderRadius: 4, backgroundColor: t.color.link },
  button: {
    minHeight: 54,
    borderRadius: 999,
    backgroundColor: t.color.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: { fontFamily: t.font.label, fontSize: 16, color: t.color.text },
  error: {
    fontFamily: t.font.body,
    fontSize: 13,
    lineHeight: 19,
    color: t.color.error,
    textAlign: 'center',
  },
});
