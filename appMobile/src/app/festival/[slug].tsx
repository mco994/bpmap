import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import {
  effectiveStatus,
  formatDateRange,
  formatPrice,
  genreLabel,
  getFestivalBySlug,
  sizeTierForCapacity,
  sizeTierLabel,
  statusLabel,
} from '@bpmap/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { toggleFavorite, useIsFavorite } from '@/lib/favorites';
import { ensureNotificationSetup, scheduleFestivalReminder } from '@/lib/notifications';

export default function FestivalDetailScreen() {
  const theme = useTheme();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const festival = slug ? getFestivalBySlug(slug) : undefined;
  const isFavorite = useIsFavorite(festival?.id ?? '');

  if (!festival) {
    return (
      <ThemedView style={styles.centered}>
        <Stack.Screen options={{ title: 'Introuvable' }} />
        <ThemedText type="subtitle">Festival introuvable</ThemedText>
      </ThemedView>
    );
  }

  const tier = sizeTierForCapacity(festival.capacity);

  const onRemind = async () => {
    const granted = await ensureNotificationSetup();
    if (!granted) {
      Alert.alert('Notifications', 'Autorise les notifications pour recevoir un rappel.');
      return;
    }
    const id = await scheduleFestivalReminder(festival);
    Alert.alert(
      'Rappel',
      id
        ? 'Rappel programmé avant le festival.'
        : 'Impossible de programmer (festival passé ou sans date).',
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: festival.name }} />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">{festival.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {festival.city}, {festival.region}
        </ThemedText>
        <ThemedText>{formatDateRange(festival.startDate, festival.endDate)}</ThemedText>
        <ThemedText type="small">{statusLabel(effectiveStatus(festival))}</ThemedText>

        <View style={styles.actions}>
          <Pressable
            onPress={() => toggleFavorite(festival.id)}
            style={[styles.action, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText type="smallBold">{isFavorite ? '♥ Favori' : '♡ Favori'}</ThemedText>
          </Pressable>
          <Pressable
            onPress={onRemind}
            style={[styles.action, { backgroundColor: theme.backgroundElement }]}
          >
            <ThemedText type="smallBold">🔔 Me rappeler</ThemedText>
          </Pressable>
        </View>

        {festival.description ? (
          <ThemedText style={styles.block}>{festival.description}</ThemedText>
        ) : null}

        <View style={styles.block}>
          <ThemedText type="subtitle">Genres</ThemedText>
          <ThemedText>{festival.genres.map(genreLabel).join(', ')}</ThemedText>
        </View>

        {tier ? (
          <View style={styles.block}>
            <ThemedText type="subtitle">Taille</ThemedText>
            <ThemedText>{sizeTierLabel(tier)}</ThemedText>
          </View>
        ) : null}

        <View style={styles.block}>
          <ThemedText type="subtitle">Tarifs</ThemedText>
          <ThemedText>Journée : {formatPrice(festival.priceDay)}</ThemedText>
          <ThemedText>Pass complet : {formatPrice(festival.priceFull)}</ThemedText>
        </View>

        {festival.lineup && festival.lineup.length > 0 ? (
          <View style={styles.block}>
            <ThemedText type="subtitle">Line-up</ThemedText>
            <ThemedText>{festival.lineup.join(', ')}</ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.three, gap: Spacing.two },
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  action: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  block: { gap: Spacing.one, marginTop: Spacing.two },
});
