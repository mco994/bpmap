import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllFestivals, sortByDateThenName } from '@bpmap/shared';

import { ChangesFeed } from '@/components/changes-feed';
import { FestivalRow } from '@/components/festival-row';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { useFavorites } from '@/lib/favorites';

export default function SuivisScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const favorites = useFavorites();
  const all = useMemo(() => getAllFestivals(), []);

  const followed = useMemo(
    () => sortByDateThenName(all.filter((f) => favorites.has(f.id))),
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
          ListHeaderComponent={<ChangesFeed followedIds={favorites} />}
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
