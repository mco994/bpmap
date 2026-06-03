import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet } from 'react-native';
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

export default function FestivalsScreen() {
  const all = useMemo(() => getAllFestivals(), []);
  const now = useMemo(() => new Date(), []);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);

  const festivals = useMemo(() => applyFilters(all, filters, now), [all, filters, now]);

  return (
    <ThemedView style={styles.container}>
      <FestivalFilters
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(EMPTY_FILTERS)}
        resultCount={festivals.length}
      />
      <FlatList
        data={festivals}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <FestivalRow festival={item} />}
      />
    </ThemedView>
  );
}

function FestivalRow({ festival }: { festival: Festival }) {
  const theme = useTheme();
  const status = effectiveStatus(festival);
  const showStatus = status === 'cancelled' || status === 'passed';

  return (
    <Link href={{ pathname: '/festival/[slug]', params: { slug: festival.slug } }} asChild>
      <Pressable style={[styles.row, { borderBottomColor: theme.backgroundElement }]}>
        <ThemedText type="subtitle">{festival.name}</ThemedText>
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
  list: { padding: Spacing.three },
  row: {
    paddingVertical: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
});
