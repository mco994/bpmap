import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  bestQueryMatch,
  formatDateRange,
  queryMatchRange,
  type Festival,
  type QueryMatchField,
} from '@bpmap/shared';

import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const MAX_SUGGESTIONS = 6;

const FIELD_LABELS: Record<QueryMatchField, string | null> = {
  name: null,
  city: 'Ville',
  artist: 'Line-up',
  genre: 'Genre',
  organizer: 'Organisateur',
};

const FIELD_ICONS: Record<QueryMatchField, keyof typeof Ionicons.glyphMap> = {
  name: 'sparkles-outline',
  city: 'location-outline',
  artist: 'musical-notes-outline',
  genre: 'pricetag-outline',
  organizer: 'people-outline',
};

type Props = {
  festivals: Festival[];
  query: string;
  onSelect: (festival: Festival) => void;
};

function Highlight({
  value,
  query,
  style,
  accent,
}: {
  value: string;
  query: string;
  style: object;
  accent: string;
}) {
  const range = queryMatchRange(value, query);
  if (!range) {
    return (
      <Text style={style} numberOfLines={1}>
        {value}
      </Text>
    );
  }
  const [start, end] = range;
  return (
    <Text style={style} numberOfLines={1}>
      {value.slice(0, start)}
      <Text style={{ color: accent, fontWeight: '800' }}>{value.slice(start, end)}</Text>
      {value.slice(end)}
    </Text>
  );
}

export function SearchSuggestions({ festivals, query, onSelect }: Props) {
  const theme = useTheme();

  const items = useMemo(
    () =>
      festivals
        .map((festival) => ({ festival, match: bestQueryMatch(festival, query) }))
        .filter((item) => item.match !== null)
        .slice(0, MAX_SUGGESTIONS),
    [festivals, query],
  );

  return (
    <ThemedView style={styles.box}>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
        {items.length === 0 ? (
          <View style={styles.row}>
            <Text style={[styles.sub, { color: theme.textSecondary }]}>Aucun résultat</Text>
          </View>
        ) : (
          items.map(({ festival, match }, i) => {
            const field = match!.field;
            const label = FIELD_LABELS[field];
            return (
              <Pressable
                key={festival.id}
                onPress={() => onSelect(festival)}
                style={[
                  styles.row,
                  i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.backgroundSelected },
                ]}
              >
                <Highlight
                  value={festival.name}
                  query={field === 'name' ? query : ''}
                  style={[styles.title, { color: theme.text }]}
                  accent={theme.accent}
                />
                <Text style={[styles.sub, { color: theme.textSecondary }]} numberOfLines={1}>
                  {festival.city} · {formatDateRange(festival.startDate, festival.endDate)}
                </Text>
                {label ? (
                  <View style={[styles.matchChip, { backgroundColor: theme.accentSoft }]}>
                    <Ionicons name={FIELD_ICONS[field]} size={12} color={theme.accent} />
                    <Text style={[styles.matchLabel, { color: theme.textSecondary }]}>
                      {label}{match!.approximate ? ' ≈ ' : ' : '}
                    </Text>
                    <Highlight
                      value={match!.value}
                      query={query}
                      style={[styles.matchValue, { color: theme.text }]}
                      accent={theme.accent}
                    />
                  </View>
                ) : null}
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 14,
    marginTop: Spacing.one,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  scroll: { maxHeight: 330 },
  row: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
  },
  matchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.half,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.three,
    marginTop: 2,
  },
  matchLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
  matchValue: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    maxWidth: 200,
  },
});
