import { useMemo, useRef, useState } from 'react';
import { Keyboard, LayoutAnimation, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, GeoJSONSource, Layer, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  applyFilters,
  bestQueryMatch,
  filterFestivalsByQuery,
  formatDateRange,
  formatFromPrice,
  franceBorderGeoJSON,
  franceMaskGeoJSON,
  getAllFestivals,
  sizeTierForCapacity,
  SIZE_TIERS,
  type Festival,
} from '@bpmap/shared';

import { FilterPanel } from '@/components/filter-panel';
import { GenreChips } from '@/components/genre-chips';
import { SearchSuggestions } from '@/components/search-suggestions';
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

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const FRANCE_CENTER: [number, number] = [2.5, 46.6];
const PIN_COLOR = '#DB2777';
const PIN_SELECTED_COLOR = '#9D174D';
const FRANCE_MASK = franceMaskGeoJSON();
const FRANCE_BORDER = franceBorderGeoJSON();

export default function CarteScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const all = useMemo(
    () => getAllFestivals().filter((f) => Number.isFinite(f.lat) && Number.isFinite(f.lng)),
    [],
  );
  const now = useMemo(() => new Date(), []);
  const filterState = useFilterState();
  const { filters, query } = filterState;
  const [selected, setSelected] = useState<Festival | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const cameraRef = useRef<CameraRef>(null);

  const festivals = useMemo(
    () => filterFestivalsByQuery(applyFilters(all, filters, now), query),
    [all, filters, query, now],
  );
  const active = activeFiltersCount(filters);

  const byId = useMemo(() => new globalThis.Map(festivals.map((f) => [f.id, f])), [festivals]);

  const shape = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: festivals.map((f) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [f.lng, f.lat] },
        properties: { id: f.id },
      })),
    }),
    [festivals],
  );

  const select = (f: Festival | null) => {
    setSelected(f);
    setExpanded(false);
  };

  const toggleSearch = (open: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchOpen(open);
  };

  const closeSearch = () => {
    if (!searchOpen) return;
    Keyboard.dismiss();
    toggleSearch(false);
  };

  const openFiche = () => {
    if (!selected) return;
    const slug = selected.slug;
    select(null);
    router.push({ pathname: '/festival/[slug]', params: { slug } });
  };

  const onSuggestionSelect = (festival: Festival) => {
    Keyboard.dismiss();
    toggleSearch(false);
    select(festival);
    cameraRef.current?.flyTo({
      center: [festival.lng, festival.lat],
      zoom: 8,
      duration: 900,
    });
  };

  const sizeTier = selected ? sizeTierForCapacity(selected.capacity) : null;
  const sizeLabel = sizeTier ? SIZE_TIERS.find((s) => s.tier === sizeTier)?.label : null;
  const selectedMatch = selected ? bestQueryMatch(selected, query) : null;

  return (
    <View style={styles.container}>
      <Map
        mapStyle={MAP_STYLE}
        style={styles.map}
        onPress={() => {
          closeSearch();
          select(null);
        }}
      >
        <Camera ref={cameraRef} initialViewState={{ center: FRANCE_CENTER, zoom: 4.6 }} />
        <GeoJSONSource id="france-mask" data={FRANCE_MASK}>
          <Layer
            id="france-mask-fill"
            type="fill"
            paint={{ 'fill-color': '#f6f0f7', 'fill-opacity': 0.93 }}
          />
        </GeoJSONSource>
        <GeoJSONSource id="france-border" data={FRANCE_BORDER}>
          <Layer
            id="france-border-line"
            type="line"
            paint={{ 'line-color': '#c026d3', 'line-opacity': 0.35, 'line-width': 1.2 }}
          />
        </GeoJSONSource>
        <GeoJSONSource
          id="festivals"
          data={shape}
          onPress={(event) => {
            event.stopPropagation();
            closeSearch();
            const id = event.nativeEvent.features?.[0]?.properties?.id;
            const festival = typeof id === 'string' ? byId.get(id) : undefined;
            if (festival) select(festival.id === selected?.id ? null : festival);
          }}
        >
          <Layer
            id="festival-pins"
            type="circle"
            paint={{
              'circle-radius': 7,
              'circle-color': PIN_COLOR,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />
          <Layer
            id="festival-pin-selected"
            type="circle"
            filter={['==', ['get', 'id'], selected?.id ?? '']}
            paint={{
              'circle-radius': 10,
              'circle-color': PIN_SELECTED_COLOR,
              'circle-stroke-width': 2.5,
              'circle-stroke-color': '#ffffff',
            }}
          />
        </GeoJSONSource>
      </Map>

      <View style={[styles.topArea, { top: insets.top + Spacing.two }]}>
        <View style={styles.topBar}>
        <View
          style={[
            styles.searchPill,
            searchOpen && styles.searchPillOpen,
            { backgroundColor: theme.background },
          ]}
        >
          {searchOpen ? (
            <>
              <Pressable
                onPress={() => toggleSearch(false)}
                hitSlop={8}
                accessibilityLabel="Fermer la recherche"
              >
                <Ionicons name="arrow-back" size={18} color={theme.accent} />
              </Pressable>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Festival, artiste, ville, orga…"
                placeholderTextColor={theme.textSecondary}
                autoCorrect={false}
                autoFocus
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
            </>
          ) : (
            <Pressable
              onPress={() => toggleSearch(true)}
              hitSlop={8}
              accessibilityLabel="Rechercher"
              style={styles.searchToggle}
            >
              <Ionicons name="search" size={18} color={theme.accent} />
              {query ? <View style={[styles.dot, { backgroundColor: theme.accentStrong }]} /> : null}
            </Pressable>
          )}
        </View>

        {!searchOpen ? (
          <View style={styles.topBarRight}>
            {hasActiveFilters(filterState) ? (
              <Pressable
                onPress={clearAllFilters}
                accessibilityLabel="Retirer tous les filtres"
                style={[styles.fab, { backgroundColor: theme.background }]}
              >
                <Ionicons name="close" size={16} color={theme.accent} />
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => setPanelOpen(true)}
              accessibilityLabel="Ouvrir les filtres"
              style={[
                styles.fab,
                { backgroundColor: active > 0 ? theme.accentSoft : theme.background },
              ]}
            >
              <Ionicons name="options-outline" size={16} color={theme.accent} />
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                {' '}
                Filtres{active > 0 ? ` · ${active}` : ''}
              </ThemedText>
            </Pressable>
          </View>
        ) : null}
        </View>

        {searchOpen && query.trim() ? (
          <SearchSuggestions
            festivals={festivals}
            query={query}
            onSelect={onSuggestionSelect}
          />
        ) : null}
      </View>

      {selected ? (
        <ThemedView style={styles.popin}>
          <View style={styles.popinTitleRow}>
            <ThemedText type="subtitle" numberOfLines={1} style={styles.popinTitle}>
              {selected.name}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: theme.accent }}>
              {formatFromPrice(selected)}
            </ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            {selected.city} · {formatDateRange(selected.startDate, selected.endDate)}
          </ThemedText>
          <View style={styles.chipsRow}>
            <GenreChips
              genres={selected.genres}
              highlight={selectedMatch?.field === 'genre' ? selectedMatch.genreSlug : undefined}
            />
          </View>

          {expanded ? (
            <View style={styles.details}>
              {selected.description ? (
                <ThemedText type="small" numberOfLines={4}>
                  {selected.description}
                </ThemedText>
              ) : null}
              {selected.organizer || sizeLabel ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {[selected.organizer, sizeLabel, selected.capacity ? `~${selected.capacity.toLocaleString('fr-FR')} pers.` : null]
                    .filter(Boolean)
                    .join(' · ')}
                </ThemedText>
              ) : null}
              {selected.lineup && selected.lineup.length > 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {selected.lineup.slice(0, 8).join(', ')}
                  {selected.lineup.length > 8 ? '…' : ''}
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actions}>
            <Pressable onPress={() => setExpanded((v) => !v)} hitSlop={8}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                {expanded ? 'Voir moins' : 'Voir plus'}
              </ThemedText>
            </Pressable>
            <Pressable onPress={openFiche} hitSlop={8}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                Voir la fiche →
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      ) : null}

      <FilterPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        resultCount={festivals.length}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topArea: {
    position: 'absolute',
    left: Spacing.two,
    right: Spacing.two,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: Spacing.one,
    marginLeft: 'auto',
  },
  searchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Spacing.four,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  searchPillOpen: { flex: 1 },
  searchToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginLeft: 2,
  },
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  popin: {
    position: 'absolute',
    left: Spacing.three,
    right: Spacing.three,
    bottom: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.half,
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  popinTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  popinTitle: { flex: 1 },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.half,
  },
  details: { gap: Spacing.one, marginTop: Spacing.one },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
});
