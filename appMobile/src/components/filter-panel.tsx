import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FestivalFilters } from '@/components/festival-filters';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { clearAllFilters, setFilters, useFilterState } from '@/lib/filters-store';
import {
  CLOSE_TIMING,
  DISMISS_SPRING,
  OPEN_TIMING,
  project,
  rubberband,
  SNAP_BACK_SPRING,
} from '@/lib/motion';
import { PressableScale } from '@/components/pressable-scale';

type Props = {
  open: boolean;
  onClose: () => void;
  resultCount: number;
};

export function FilterPanel({ open, onClose, resultCount }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const panelWidth = Math.min(width * 0.84, 360);
  const { filters } = useFilterState();
  const [visible, setVisible] = useState(open);
  const offset = useSharedValue(panelWidth);
  const dragStart = useSharedValue(0);

  if (open && !visible) {
    setVisible(true);
  }

  useEffect(() => {
    if (open) {
      offset.set(withTiming(0, OPEN_TIMING));
    } else if (visible) {
      offset.set(
        withTiming(panelWidth, CLOSE_TIMING, (finished) => {
          if (finished) scheduleOnRN(setVisible, false);
        }),
      );
    }
  }, [open, visible, panelWidth, offset]);

  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [open, onClose]);

  const pan = useMemo(() => {
    const finishDismiss = () => {
      setVisible(false);
      onClose();
    };
    return Gesture.Pan()
      .activeOffsetX([-10, 10])
      .failOffsetY([-10, 10])
      .onStart(() => {
        dragStart.set(offset.get());
      })
      .onUpdate((event) => {
        const next = dragStart.get() + event.translationX;
        offset.set(next < 0 ? -rubberband(-next, panelWidth) : next);
      })
      .onEnd((event) => {
        if (offset.get() + project(event.velocityX) > panelWidth * 0.4) {
          offset.set(
            withSpring(panelWidth, { ...DISMISS_SPRING, velocity: event.velocityX }, (finished) => {
              if (finished) scheduleOnRN(finishDismiss);
            }),
          );
        } else {
          offset.set(withSpring(0, { ...SNAP_BACK_SPRING, velocity: event.velocityX }));
        }
      });
  }, [panelWidth, onClose, offset, dragStart]);

  const panelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
  }));
  const scrimStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.get(), [0, panelWidth], [1, 0], Extrapolation.CLAMP),
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.scrim, scrimStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View
          style={[styles.panel, { width: panelWidth * 2, right: -panelWidth }, panelStyle]}
        >
          <ThemedView
            style={[
              styles.panelInner,
              { paddingTop: insets.top + Spacing.two, paddingRight: panelWidth },
            ]}
          >
            <View style={styles.panelHeader}>
              <View>
                <ThemedText type="subtitle">Filtres</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {resultCount} événement{resultCount > 1 ? 's' : ''}
                </ThemedText>
              </View>
              <PressableScale onPress={onClose} hitSlop={12} accessibilityLabel="Fermer les filtres">
                <ThemedText type="subtitle">✕</ThemedText>
              </PressableScale>
            </View>
            <FestivalFilters value={filters} onChange={setFilters} onReset={clearAllFilters} />
          </ThemedView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  panelInner: { flex: 1, paddingTop: Spacing.three },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.two,
  },
});
