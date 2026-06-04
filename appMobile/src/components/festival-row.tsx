import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  bestQueryMatch,
  effectiveStatus,
  formatDateRange,
  formatFromPrice,
  statusLabel,
  type Festival,
} from '@bpmap/shared';

import { GenreChips } from '@/components/genre-chips';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { toggleFavorite, useIsFavorite } from '@/lib/favorites';
import { genreColor } from '@/lib/genre-colors';

type Props = {
  festival: Festival;
  highlightQuery?: string;
};

export function FestivalRow({ festival, highlightQuery = '' }: Props) {
  const theme = useTheme();
  const status = effectiveStatus(festival);
  const showStatus = status === 'cancelled' || status === 'passed';
  const isFavorite = useIsFavorite(festival.id);
  const accentGenre = genreColor(festival.genres[0] ?? '');
  const match = bestQueryMatch(festival, highlightQuery);

  return (
    <Link href={{ pathname: '/festival/[slug]', params: { slug: festival.slug } }} asChild>
      <Pressable
        style={StyleSheet.flatten([
          styles.card,
          { backgroundColor: theme.backgroundElement, borderLeftColor: accentGenre },
        ])}
      >
        <View style={styles.cardTitleRow}>
          <Text numberOfLines={1} style={[styles.cardTitle, { color: theme.text }]}>
            {festival.name}
          </Text>
          <ThemedText type="smallBold" style={{ color: theme.accent }}>
            {formatFromPrice(festival)}
          </ThemedText>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(festival.id);
            }}
            hitSlop={10}
            accessibilityLabel={isFavorite ? 'Ne plus suivre' : 'Suivre cet événement'}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={isFavorite ? theme.accentStrong : theme.textSecondary}
            />
          </Pressable>
        </View>
        <ThemedText type="small" themeColor="textSecondary">
          {festival.city} · {formatDateRange(festival.startDate, festival.endDate)}
        </ThemedText>
        <View style={styles.chipsRow}>
          <GenreChips
            genres={festival.genres}
            highlight={match?.field === 'genre' ? match.genreSlug : undefined}
          />
          {showStatus ? (
            <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>
              {statusLabel(status)}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderLeftWidth: 3,
    paddingVertical: Spacing.two + Spacing.half,
    paddingHorizontal: Spacing.three,
    gap: Spacing.half,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.half,
  },
  statusLabel: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
