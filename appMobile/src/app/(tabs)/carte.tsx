import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Camera, Map, Marker } from '@maplibre/maplibre-react-native';
import { getAllFestivals } from '@bpmap/shared';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
const FRANCE_CENTER: [number, number] = [2.5, 46.6];

export default function CarteScreen() {
  const router = useRouter();
  const festivals = useMemo(
    () => getAllFestivals().filter((f) => Number.isFinite(f.lat) && Number.isFinite(f.lng)),
    [],
  );

  return (
    <Map mapStyle={MAP_STYLE} style={styles.map}>
      <Camera initialViewState={{ center: FRANCE_CENTER, zoom: 4.6 }} />
      {festivals.map((f) => (
        <Marker
          key={f.id}
          lngLat={[f.lng, f.lat]}
          anchor="bottom"
          onPress={() => router.push({ pathname: '/festival/[slug]', params: { slug: f.slug } })}
        >
          <View style={styles.pin} />
        </Marker>
      ))}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  pin: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#208AEF',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});
