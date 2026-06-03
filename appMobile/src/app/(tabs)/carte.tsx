import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import {
  formatDateRange,
  formatFromPrice,
  genreLabel,
  getAllFestivals,
  type Festival,
} from '@bpmap/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const FRANCE_CENTER: [number, number] = [2.5, 46.6];

export default function CarteScreen() {
  const router = useRouter();
  const festivals = useMemo(
    () => getAllFestivals().filter((f) => Number.isFinite(f.lat) && Number.isFinite(f.lng)),
    [],
  );
  const [selected, setSelected] = useState<Festival | null>(null);
  const [expanded, setExpanded] = useState(false);
  const markerPress = useRef(false);

  const select = (f: Festival | null) => {
    setSelected(f);
    setExpanded(false);
  };

  const onMarkerPress = (f: Festival) => {
    markerPress.current = true;
    setTimeout(() => {
      markerPress.current = false;
    }, 300);
    select(f);
  };

  const onMapPress = () => {
    if (markerPress.current) return;
    select(null);
  };

  const openFiche = () => {
    if (!selected) return;
    const slug = selected.slug;
    select(null);
    router.push({ pathname: '/festival/[slug]', params: { slug } });
  };

  return (
    <View style={styles.container}>
      <Map mapStyle={MAP_STYLE} style={styles.map} onPress={onMapPress}>
        <Camera initialViewState={{ center: FRANCE_CENTER, zoom: 4.6 }} />
        {festivals.map((f) => (
          <Marker key={f.id} lngLat={[f.lng, f.lat]} anchor="center" onPress={() => onMarkerPress(f)}>
            <View style={[styles.pin, selected?.id === f.id && styles.pinSelected]} />
          </Marker>
        ))}
      </Map>

      {selected ? (
        <ThemedView style={styles.popin}>
          <ThemedText type="subtitle">{selected.name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {selected.city} · {formatDateRange(selected.startDate, selected.endDate)}
          </ThemedText>

          {expanded ? (
            <View style={styles.details}>
              <ThemedText type="small">
                {selected.genres.map(genreLabel).join(' · ')}
              </ThemedText>
              <ThemedText type="smallBold">{formatFromPrice(selected)}</ThemedText>
              {selected.lineup && selected.lineup.length > 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {selected.lineup.slice(0, 4).join(', ')}
                  {selected.lineup.length > 4 ? '…' : ''}
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
              <ThemedText type="smallBold" style={styles.ficheLink}>
                Voir la fiche →
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  pin: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#A855F7',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  pinSelected: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#DB2777',
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
  details: { gap: Spacing.half, marginTop: Spacing.one },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  ficheLink: { color: '#C026D3' },
});
