import { useEffect, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FestivalFilters } from '@/components/festival-filters';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { clearAllFilters, setFilters, useFilterState } from '@/lib/filters-store';

const PANEL_WIDTH = Math.min(Dimensions.get('window').width * 0.84, 360);

type Props = {
  open: boolean;
  onClose: () => void;
  resultCount: number;
};

export function FilterPanel({ open, onClose, resultCount }: Props) {
  const insets = useSafeAreaInsets();
  const { filters } = useFilterState();
  const [visible, setVisible] = useState(open);
  const [slide] = useState(() => new Animated.Value(0));

  if (open && !visible) {
    setVisible(true);
  }

  useEffect(() => {
    if (open) {
      Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    } else {
      Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start(
        ({ finished }) => {
          if (finished) setVisible(false);
        },
      );
    }
  }, [open, slide]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <Animated.View
        style={[
          styles.panel,
          {
            width: PANEL_WIDTH,
            transform: [
              {
                translateX: slide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [PANEL_WIDTH, 0],
                }),
              },
            ],
          },
        ]}
      >
        <ThemedView style={[styles.panelInner, { paddingTop: insets.top + Spacing.two }]}>
          <View style={styles.panelHeader}>
            <View>
              <ThemedText type="subtitle">Filtres</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {resultCount} événement{resultCount > 1 ? 's' : ''}
              </ThemedText>
            </View>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Fermer les filtres">
              <ThemedText type="subtitle">✕</ThemedText>
            </Pressable>
          </View>
          <FestivalFilters value={filters} onChange={setFilters} onReset={clearAllFilters} />
        </ThemedView>
      </Animated.View>
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
    right: 0,
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
