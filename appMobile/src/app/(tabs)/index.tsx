import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Keyboard, LayoutAnimation, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  UserLocation,
  type CameraRef,
  type StyleSpecification,
} from '@maplibre/maplibre-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  applyFilters,
  bestQueryMatch,
  filterFestivalsByQuery,
  formatDateRange,
  formatFromPrice,
  franceBorderGeoJSON,
  franceEnclavesGeoJSON,
  franceMaskGeoJSON,
  getAllFestivals,
  hideEnclaveCountryLabels,
  sizeTierForCapacity,
  SIZE_TIERS,
  type Festival,
} from '@bpmap/shared';

import { FilterPanel } from '@/components/filter-panel';
import { GenreChips } from '@/components/genre-chips';
import { ItineraryButton } from '@/components/itinerary-button';
import { SearchSuggestions } from '@/components/search-suggestions';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { getCurrentCoords } from '@/lib/geo';
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
const FRANCE_ENCLAVES = franceEnclavesGeoJSON();
const FRANCE_BORDER = franceBorderGeoJSON();

export default function CarteScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [mapStyle, setMapStyle] = useState<string | StyleSpecification>(MAP_STYLE);

  useEffect(() => {
    let cancelled = false;
    fetch(MAP_STYLE)
      .then((res) => res.json())
      .then((style) => {
        if (!cancelled) setMapStyle(hideEnclaveCountryLabels(style) as StyleSpecification);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
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
  const [showPuck, setShowPuck] = useState(false);
  const [locating, setLocating] = useState(false);
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

  const select = (f: Festival | null, compact = false) => {
    setSelected(f);
    setExpanded(f != null && !compact);
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

  const goToMyLocation = async () => {
    if (locating) return;
    setLocating(true);
    try {
      const coords = await getCurrentCoords();
      if (!coords) {
        Alert.alert(
          'Position indisponible',
          "Active la localisation pour BPMap dans les réglages de ton téléphone.",
        );
        return;
      }
      setShowPuck(true);
      cameraRef.current?.flyTo({
        center: [coords.lng, coords.lat],
        zoom: 12,
        duration: 900,
      });
    } finally {
      setLocating(false);
    }
  };

  const onSuggestionSelect = (festival: Festival) => {
    Keyboard.dismiss();
    toggleSearch(false);
    select(festival, true);
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
        mapStyle={mapStyle}
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
        <GeoJSONSource id="france-enclaves" data={FRANCE_ENCLAVES}>
          <Layer
            id="france-enclaves-fill"
            type="fill"
            afterId="france-mask-fill"
            paint={{ 'fill-color': '#f6f0f7', 'fill-opacity': 0.93 }}
          />
        </GeoJSONSource>
        <GeoJSONSource id="france-border" data={FRANCE_BORDER}>
          <Layer
            id="france-border-line"
            type="line"
            afterId="france-enclaves-fill"
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
            afterId="france-border-line"
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
            afterId="festival-pins"
            filter={['==', ['get', 'id'], selected?.id ?? '']}
            paint={{
              'circle-radius': 10,
              'circle-color': PIN_SELECTED_COLOR,
              'circle-stroke-width': 2.5,
              'circle-stroke-color': '#ffffff',
            }}
          />
        </GeoJSONSource>
        {showPuck ? <UserLocation animated /> : null}
      </Map>

      <Pressable
        onPress={goToMyLocation}
        disabled={locating}
        accessibilityLabel="Centrer sur ma position"
        style={[
          styles.locateFab,
          { backgroundColor: theme.background, bottom: (selected ? 200 : 0) + insets.bottom + Spacing.four },
        ]}
      >
        <Ionicons
          name="locate"
          size={20}
          color={locating ? theme.textSecondary : theme.accent}
        />
      </Pressable>

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
        <Pressable
          onPress={() => setExpanded(true)}
          disabled={expanded}
          accessibilityLabel={expanded ? undefined : 'Voir les détails'}
          style={[styles.popin, { backgroundColor: theme.background }]}
        >
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
            <ItineraryButton festival={selected} />
            <Pressable onPress={openFiche} hitSlop={8}>
              <ThemedText type="smallBold" style={{ color: theme.accent }}>
                Voir la fiche →
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
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
  locateFab: {
    position: 'absolute',
    right: Spacing.three,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
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
