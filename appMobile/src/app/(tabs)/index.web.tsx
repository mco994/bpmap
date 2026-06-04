import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function CarteWebScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="subtitle">Carte disponible sur l&apos;app mobile</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Le rendu MapLibre est natif (Android / iOS).
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    padding: 24,
  },
});
