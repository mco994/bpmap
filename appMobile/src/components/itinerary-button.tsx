import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import type { Festival } from '@bpmap/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { openDirections, suggestAddresses, type AddressSuggestion } from '@/lib/geo';
import {
  CLOSE_TIMING,
  DISMISS_SPRING,
  OPEN_TIMING,
  project,
  rubberband,
  SNAP_BACK_SPRING,
} from '@/lib/motion';
import { PressableScale } from '@/components/pressable-scale';

export function ItineraryButton({ festival }: { festival: Festival }) {
  const theme = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [picked, setPicked] = useState<AddressSuggestion | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progress = useSharedValue(0);
  const sheetHeight = useSharedValue(windowHeight);
  const dragStart = useSharedValue(0);

  if (visible && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (visible) {
      progress.set(withTiming(1, OPEN_TIMING));
    } else if (mounted) {
      progress.set(
        withTiming(0, CLOSE_TIMING, (finished) => {
          if (finished) scheduleOnRN(setMounted, false);
        }),
      );
    }
  }, [visible, mounted, progress]);

  const close = () => {
    setVisible(false);
    setSuggestions([]);
  };

  const pan = useMemo(() => {
    const finishDismiss = () => {
      setMounted(false);
      setVisible(false);
      setSuggestions([]);
    };
    return Gesture.Pan()
      .activeOffsetY([-10, 10])
      .failOffsetX([-10, 10])
      .onStart(() => {
        dragStart.set(progress.get());
      })
      .onUpdate((event) => {
        const height = sheetHeight.get();
        const dragged = (1 - dragStart.get()) * height + event.translationY;
        const y = dragged < 0 ? -rubberband(-dragged, height) : dragged;
        progress.set(1 - y / height);
      })
      .onEnd((event) => {
        const height = sheetHeight.get();
        const y = (1 - progress.get()) * height;
        const velocity = -event.velocityY / height;
        if (y + project(event.velocityY) > height * 0.4) {
          progress.set(
            withSpring(0, { ...DISMISS_SPRING, velocity }, (finished) => {
              if (finished) scheduleOnRN(finishDismiss);
            }),
          );
        } else {
          progress.set(withSpring(1, { ...SNAP_BACK_SPRING, velocity }));
        }
      });
  }, [progress, sheetHeight, dragStart]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.get() }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - progress.get()) * sheetHeight.get() }],
  }));

  const go = async (origin?: string | { lat: number; lng: number }) => {
    close();
    try {
      await openDirections(festival, origin);
    } catch {
      Alert.alert('Itinéraire', "Impossible d'ouvrir l'application de cartes.");
    }
  };

  const onChangeAddress = (text: string) => {
    setAddress(text);
    setPicked(null);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSuggestions(await suggestAddresses(text));
    }, 300);
  };

  const pick = (s: AddressSuggestion) => {
    setAddress(s.label);
    setPicked(s);
    setSuggestions([]);
  };

  const goFromAddress = () => {
    if (picked) {
      void go({ lat: picked.lat, lng: picked.lng });
    } else if (address.trim()) {
      void go(address);
    }
  };

  return (
    <>
      <PressableScale
        accessibilityRole="button"
        onPress={() => setVisible(true)}
        style={[styles.action, { backgroundColor: theme.backgroundElement }]}
      >
        <Ionicons name="navigate-outline" size={16} color={theme.accent} />
        <ThemedText type="smallBold"> Itinéraire</ThemedText>
      </PressableScale>

      <Modal visible={mounted} transparent animationType="none" onRequestClose={close}>
        <GestureHandlerRootView style={styles.flex}>
          <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <Animated.View style={[styles.backdrop, backdropStyle]}>
              <Pressable
                style={styles.fill}
                onPress={close}
                accessibilityLabel="Fermer l'itinéraire"
              />
            </Animated.View>
            <GestureDetector gesture={pan}>
              <Animated.View
                style={sheetStyle}
                onLayout={(event) => sheetHeight.set(event.nativeEvent.layout.height)}
              >
                <ThemedView style={[styles.sheetFill, { height: windowHeight }]} />
                <ThemedView style={styles.sheet}>
                  <View style={[styles.grabber, { backgroundColor: theme.backgroundSelected }]} />
                  <ThemedText type="subtitle">Itinéraire vers {festival.name}</ThemedText>

                  <PressableScale
                    onPress={() => go()}
                    style={[styles.primary, { backgroundColor: theme.accent }]}
                  >
                    <Ionicons name="locate" size={16} color="#ffffff" />
                    <ThemedText type="smallBold" style={styles.primaryLabel}>
                      {' '}
                      Depuis ma position
                    </ThemedText>
                  </PressableScale>

                  <ThemedText type="small" themeColor="textSecondary">
                    ou depuis une adresse
                  </ThemedText>

                  <TextInput
                    value={address}
                    onChangeText={onChangeAddress}
                    accessibilityLabel="Adresse de départ"
                    placeholder="Adresse de départ"
                    placeholderTextColor={theme.textSecondary}
                    returnKeyType="go"
                    onSubmitEditing={goFromAddress}
                    style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                  />

                  {suggestions.length > 0 ? (
                    <View style={[styles.suggestions, { borderColor: theme.backgroundSelected }]}>
                      {suggestions.map((s) => (
                        <Pressable
                          key={s.label}
                          onPress={() => pick(s)}
                          style={({ pressed }) => [
                            styles.suggestion,
                            pressed && { backgroundColor: theme.backgroundElement },
                          ]}
                        >
                          <ThemedText type="small">{s.label}</ThemedText>
                        </Pressable>
                      ))}
                    </View>
                  ) : null}

                  <PressableScale
                    disabled={!address.trim()}
                    onPress={goFromAddress}
                    style={[
                      styles.primary,
                      { backgroundColor: theme.accentSoft, opacity: address.trim() ? 1 : 0.4 },
                    ]}
                  >
                    <ThemedText type="smallBold" style={{ color: theme.accent }}>
                      Y aller depuis cette adresse
                    </ThemedText>
                  </PressableScale>
                </ThemedView>
              </Animated.View>
            </GestureDetector>
          </KeyboardAvoidingView>
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, justifyContent: 'flex-end' },
  fill: { flex: 1 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheetFill: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 5,
    borderRadius: 3,
    marginBottom: Spacing.one,
  },
  sheet: {
    padding: Spacing.four,
    paddingTop: Spacing.two,
    gap: Spacing.two,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  primary: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  primaryLabel: { color: '#ffffff' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  suggestions: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  suggestion: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
