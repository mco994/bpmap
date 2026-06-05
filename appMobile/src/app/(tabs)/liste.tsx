import { useMemo, useState } from 'react';
import { Pressable, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  applyFilters,
  bestQueryMatch,
  filterFestivalsByQuery,
  getAllFestivals,
  groupByLetter,
  groupByMonth,
  type SortMode,
} from '@bpmap/shared';

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
  const [sortMode, setSortMode] = useState<SortMode>('date');

  const festivals = useMemo(
    () => filterFestivalsByQuery(applyFilters(all, filters, now), query),
    [all, filters, query, now],
  );
  const byDate = useMemo(() => groupByMonth(festivals), [festivals]);
  const byAlpha = useMemo(() => groupByLetter(festivals), [festivals]);
  const sections = sortMode === 'alpha' ? byAlpha : byDate;
  const active = activeFiltersCount(filters);
  const correction = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) return null;
    for (const festival of festivals) {
      const match = bestQueryMatch(festival, trimmed);
      if (match) return match.approximate ? match.value : null;
    }
    return null;
  }, [festivals, query]);

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
        <View style={styles.countRow}>
          <ThemedText type="small" themeColor="textSecondary">
            {festivals.length} événement{festivals.length > 1 ? 's' : ''}
          </ThemedText>
          {correction ? (
            <View style={[styles.correctionChip, { backgroundColor: theme.accentSoft }]}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                ≈ {correction}
              </ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.subHeaderRight}>
          <View style={[styles.sortToggle, { borderColor: theme.backgroundElement }]}>
            {(['date', 'alpha'] as const).map((mode) => (
              <Pressable
                key={mode}
                onPress={() => setSortMode(mode)}
                accessibilityLabel={mode === 'date' ? 'Trier par date' : 'Trier par ordre alphabétique'}
                style={[
                  styles.sortOption,
                  sortMode === mode
                    ? { backgroundColor: theme.accentSoft }
                    : styles.sortOptionInactive,
                ]}
              >
                <ThemedText
                  type="smallBold"
                  style={{ color: sortMode === mode ? theme.accent : theme.textSecondary }}
                >
                  {mode === 'date' ? 'Date' : 'A–Z'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          {hasActiveFilters(filterState) ? (
            <Pressable onPress={clearAllFilters} hitSlop={8}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                ✕ Filtres
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.listArea}>
      {([
        ['date', byDate],
        ['alpha', byAlpha],
      ] as const).map(([mode, modeSections]) => (
        <View
          key={mode}
          style={[styles.listWrap, sortMode !== mode && styles.hiddenList]}
          pointerEvents={sortMode === mode ? 'auto' : 'none'}
        >
          <SectionList
            sections={modeSections}
            keyExtractor={(f) => f.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            stickySectionHeadersEnabled
            SectionSeparatorComponent={null}
            renderSectionHeader={({ section }) => (
              <View style={[styles.sectionHeader, { backgroundColor: theme.background }]}>
                <ThemedText type="smallBold" style={{ color: theme.accent }}>
                  {section.title.toUpperCase()}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {section.data.length}
                </ThemedText>
              </View>
            )}
            renderItem={({ item }) => <FestivalRow festival={item} highlightQuery={query} />}
          />
        </View>
      ))}
      </View>

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
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  subHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  sortToggle: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  sortOption: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
  },
  sortOptionInactive: { opacity: 0.4 },
  listArea: { flex: 1 },
  listWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  hiddenList: { opacity: 0 },
  correctionChip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.three,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.one,
    marginTop: Spacing.one,
  },
});
