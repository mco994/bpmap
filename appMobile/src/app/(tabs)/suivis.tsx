import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllFestivals, type Festival } from '@bpmap/shared';

import { FestivalRow } from '@/components/festival-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { useFavorites } from '@/lib/favorites';

function byStartDate(a: Festival, b: Festival): number {
  if (a.startDate === null && b.startDate === null) return a.name.localeCompare(b.name, 'fr');
  if (a.startDate === null) return 1;
  if (b.startDate === null) return -1;
  return a.startDate.localeCompare(b.startDate);
}

export default function SuivisScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const favorites = useFavorites();
  const all = useMemo(() => getAllFestivals(), []);

  const followed = useMemo(
    () => all.filter((f) => favorites.has(f.id)).sort(byStartDate),
    [all, favorites],
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + Spacing.two }]}>
      <View style={styles.header}>
        <ThemedText type="title">Suivis</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {followed.length === 0
            ? 'Aucun événement suivi'
            : `${followed.length} événement${followed.length > 1 ? 's' : ''} suivi${followed.length > 1 ? 's' : ''}`}
        </ThemedText>
      </View>

      {followed.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={40} color={theme.textSecondary} />
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
            Touche le cœur sur un événement (liste ou fiche) pour le retrouver ici.
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={followed}
          keyExtractor={(f) => f.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <FestivalRow festival={item} />}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.two,
    gap: Spacing.half,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.six,
  },
  emptyText: { textAlign: 'center' },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.four,
    gap: Spacing.two,
  },
});
