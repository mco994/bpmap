import { StyleSheet, Text, View } from 'react-native';
import { genreLabel } from '@bpmap/shared';

import { Spacing } from '@/constants/theme';
import { genreColor, withAlpha } from '@/lib/genre-colors';

type Props = {
  genres: string[];
  highlight?: string;
};

export function GenreChips({ genres, highlight }: Props) {
  return (
    <View style={styles.row}>
      {genres.map((g) => {
        const active = g === highlight;
        return (
          <View
            key={g}
            style={[
              styles.chip,
              { backgroundColor: active ? genreColor(g) : withAlpha(genreColor(g), 0.16) },
            ]}
          >
            <Text style={[styles.label, { color: active ? '#FFFFFF' : genreColor(g) }]}>
              {genreLabel(g)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.one,
  },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Spacing.three,
  },
  label: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
  },
});
