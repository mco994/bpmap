import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  effectiveStatus,
  formatDateRange,
  formatPrice,
  formatFromPrice,
  getFestivalBySlug,
  sizeTierForCapacity,
  sizeTierLabel,
  statusLabel,
} from '@bpmap/shared';

import { GenreChips } from '@/components/genre-chips';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { toggleFavorite, useIsFavorite } from '@/lib/favorites';
import { ensureNotificationSetup, scheduleFestivalReminder } from '@/lib/notifications';
import { ItineraryButton } from '@/components/itinerary-button';

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
  const status = effectiveStatus(festival);
  const showStatus = status === 'cancelled' || status === 'passed';

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
      <Stack.Screen
        options={{
          title: festival.name,
          headerTintColor: theme.accent,
          headerStyle: { backgroundColor: theme.background },
          headerTitleStyle: { color: theme.text, fontWeight: '700', fontSize: 17 },
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">{festival.name}</ThemedText>
        <View style={styles.metaRow}>
          <Ionicons name="location" size={14} color={theme.accent} />
          <ThemedText type="small" themeColor="textSecondary">
            {festival.city}, {festival.region}
          </ThemedText>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar" size={14} color={theme.accent} />
          <ThemedText type="small">
            {formatDateRange(festival.startDate, festival.endDate)}
          </ThemedText>
          {showStatus ? (
            <View style={[styles.statusChip, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText type="small">{statusLabel(status)}</ThemedText>
            </View>
          ) : null}
        </View>
        <View style={styles.chipsBlock}>
          <GenreChips genres={festival.genres} />
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => toggleFavorite(festival.id)}
            style={[
              styles.action,
              { backgroundColor: isFavorite ? theme.accentSoft : theme.backgroundElement },
            ]}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={16}
              color={theme.accentStrong}
            />
            <ThemedText type="smallBold" style={isFavorite ? { color: theme.accent } : undefined}>
              {' '}
              Favori
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={onRemind}
            style={[styles.action, { backgroundColor: theme.backgroundElement }]}
          >
            <Ionicons name="notifications-outline" size={16} color={theme.accent} />
            <ThemedText type="smallBold"> Me rappeler</ThemedText>
          </Pressable>
          <ItineraryButton festival={festival} />
        </View>

        {festival.description ? (
          <ThemedText style={styles.block}>{festival.description}</ThemedText>
        ) : null}

        <View style={[styles.priceCard, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.priceHeader}>
            <Ionicons name="ticket-outline" size={16} color={theme.accent} />
            <ThemedText type="subtitle" style={{ color: theme.accent }}>
              {formatFromPrice(festival)}
            </ThemedText>
          </View>
          {festival.priceDay !== null ? (
            <View style={styles.priceRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Pass jour
              </ThemedText>
              <ThemedText type="smallBold">{formatPrice(festival.priceDay)}</ThemedText>
            </View>
          ) : null}
          {festival.priceFull !== null ? (
            <View style={styles.priceRow}>
              <ThemedText type="small" themeColor="textSecondary">
                Pass complet
              </ThemedText>
              <ThemedText type="smallBold">{formatPrice(festival.priceFull)}</ThemedText>
            </View>
          ) : null}
          {(festival.tariffs ?? []).map((t, i) => (
            <View key={`${t.label}-${i}`} style={styles.priceRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {t.label}
              </ThemedText>
              <ThemedText type="smallBold">{formatPrice(t.price)}</ThemedText>
            </View>
          ))}
        </View>

        {tier || festival.organizer ? (
          <View style={styles.block}>
            <ThemedText type="subtitle">Infos</ThemedText>
            {festival.organizer ? (
              <View style={styles.metaRow}>
                <Ionicons name="people-outline" size={14} color={theme.accent} />
                <ThemedText type="small">{festival.organizer}</ThemedText>
              </View>
            ) : null}
            {tier ? (
              <View style={styles.metaRow}>
                <Ionicons name="resize-outline" size={14} color={theme.accent} />
                <ThemedText type="small">
                  {sizeTierLabel(tier)}
                  {festival.capacity ? ` · ~${festival.capacity.toLocaleString('fr-FR')} pers.` : ''}
                </ThemedText>
              </View>
            ) : null}
          </View>
        ) : null}

        {festival.lineup && festival.lineup.length > 0 ? (
          <View style={styles.block}>
            <ThemedText type="subtitle">Line-up</ThemedText>
            <ThemedText type="small">{festival.lineup.join(' · ')}</ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.three, gap: Spacing.one, paddingBottom: Spacing.five },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  statusChip: {
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.three,
    marginLeft: Spacing.one,
  },
  chipsBlock: { marginTop: Spacing.one },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  block: { gap: Spacing.one, marginTop: Spacing.three },
  priceCard: {
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginBottom: Spacing.half,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
