import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { applyFilters, filterFestivalsByQuery, getAllFestivals } from '@bpmap/shared';

import { FestivalRow } from '@/components/festival-row';
import { FilterPanel } from '@/components/filter-panel';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import {
  activeFiltersCount,
  clearAllFilters,
  hasActiveFilters,
  setQuery,
  useFilterState,
} from '@/lib/filters-store';

export default function ListeScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const all = useMemo(() => getAllFestivals(), []);
  const now = useMemo(() => new Date(), []);
  const filterState = useFilterState();
  const { filters, query } = filterState;
  const [panelOpen, setPanelOpen] = useState(false);

  const festivals = useMemo(
    () => filterFestivalsByQuery(applyFilters(all, filters, now), query),
    [all, filters, query, now],
  );
  const active = activeFiltersCount(filters);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.header}>
        <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="search" size={16} color={theme.accent} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Festival, artiste, ville, orga…"
            placeholderTextColor={theme.textSecondary}
            autoCorrect={false}
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={8}
              accessibilityLabel="Effacer la recherche"
            >
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>
        <Pressable
          onPress={() => setPanelOpen(true)}
          accessibilityLabel="Ouvrir les filtres"
          style={[
            styles.filterButton,
            { backgroundColor: active > 0 ? theme.accentSoft : theme.backgroundElement },
          ]}
        >
          <Ionicons name="options-outline" size={16} color={theme.accent} />
          {active > 0 ? (
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {' '}
              {active}
            </ThemedText>
          ) : null}
        </Pressable>
      </View>

      <View style={styles.subHeader}>
        <ThemedText type="small" themeColor="textSecondary">
          {festivals.length} événement{festivals.length > 1 ? 's' : ''}
        </ThemedText>
        {hasActiveFilters(filterState) ? (
          <Pressable onPress={clearAllFilters} hitSlop={8}>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              ✕ Retirer tous les filtres
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={festivals}
        keyExtractor={(f) => f.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <FestivalRow festival={item} highlightQuery={query} />}
      />

      <FilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        resultCount={festivals.length}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: Spacing.one,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
});
