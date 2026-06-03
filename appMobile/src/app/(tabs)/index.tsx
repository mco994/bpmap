import { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import {
  applyFilters,
  effectiveStatus,
  EMPTY_FILTERS,
  formatDateRange,
  getAllFestivals,
  statusLabel,
  type Festival,
  type Filters,
} from '@bpmap/shared';

import { FestivalFilters } from '@/components/festival-filters';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { useIsFavorite } from '@/lib/favorites';

const PANEL_WIDTH = Math.min(Dimensions.get('window').width * 0.84, 360);

function activeFiltersCount(f: Filters): number {
  return (
    f.eventTypes.length +
    f.genres.length +
    f.sizes.length +
    (f.organizer.trim() ? 1 : 0) +
    (f.artist.trim() ? 1 : 0) +
    (f.priceDayMax !== null ? 1 : 0) +
    (f.priceFullMax !== null ? 1 : 0) +
    (f.dateFrom || f.dateTo ? 1 : 0) +
    (f.includePast ? 1 : 0)
  );
}

export default function FestivalsScreen() {
  const theme = useTheme();
  const all = useMemo(() => getAllFestivals(), []);
  const now = useMemo(() => new Date(), []);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [panelOpen, setPanelOpen] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;

  const festivals = useMemo(() => applyFilters(all, filters, now), [all, filters, now]);
  const active = activeFiltersCount(filters);

  const openPanel = () => {
    setPanelOpen(true);
    Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  };

  const closePanel = () => {
    Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start(() =>
      setPanelOpen(false),
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="small" themeColor="textSecondary">
          {festivals.length} événement{festivals.length > 1 ? 's' : ''}
        </ThemedText>
        <Pressable
          onPress={openPanel}
          style={[styles.filterButton, { backgroundColor: theme.backgroundElement }]}
        >
          <ThemedText type="smallBold">Filtres{active > 0 ? ` · ${active}` : ''}</ThemedText>
        </Pressable>
      </View>

      <FlatList
        data={festivals}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <FestivalRow festival={item} />}
      />

      {panelOpen ? (
        <View style={StyleSheet.absoluteFill}>
          <Pressable style={styles.scrim} onPress={closePanel} />
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
            <ThemedView style={styles.panelInner}>
              <View style={styles.panelHeader}>
                <ThemedText type="subtitle">Filtres</ThemedText>
                <Pressable onPress={closePanel} hitSlop={12} accessibilityLabel="Fermer les filtres">
                  <ThemedText type="subtitle">✕</ThemedText>
                </Pressable>
              </View>
              <FestivalFilters
                value={filters}
                onChange={setFilters}
                onReset={() => setFilters(EMPTY_FILTERS)}
                resultCount={festivals.length}
              />
            </ThemedView>
          </Animated.View>
        </View>
      ) : null}
    </ThemedView>
  );
}

function FestivalRow({ festival }: { festival: Festival }) {
  const theme = useTheme();
  const status = effectiveStatus(festival);
  const showStatus = status === 'cancelled' || status === 'passed';
  const isFavorite = useIsFavorite(festival.id);

  return (
    <Link href={{ pathname: '/festival/[slug]', params: { slug: festival.slug } }} asChild>
      <Pressable style={[styles.row, { borderBottomColor: theme.backgroundElement }]}>
        <ThemedText type="subtitle">
          {isFavorite ? '♥ ' : ''}
          {festival.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {festival.city} · {formatDateRange(festival.startDate, festival.endDate)}
        </ThemedText>
        {showStatus ? <ThemedText type="small">{statusLabel(status)}</ThemedText> : null}
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  filterButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
  },
  list: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  row: {
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
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
    paddingBottom: Spacing.one,
  },
});
