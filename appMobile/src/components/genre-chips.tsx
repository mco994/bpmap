import { StyleSheet, Text, View } from 'react-native';
import { genreLabel, genrePalette } from '@bpmap/shared';

import { Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = {
  genres: string[];
  highlight?: string;
};

export function GenreChips({ genres, highlight }: Props) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return (
    <View style={styles.row}>
      {genres.map((g) => {
        const palette = genrePalette(g);
        const active = g === highlight;
        const tone = isDark ? palette.dark : palette.light;
        const background = active ? palette.solid : tone.bg;
        const color = active ? '#FFFFFF' : tone.fg;

        return (
          <View key={g} style={[styles.chip, { backgroundColor: background }]}>
            <Text style={[styles.label, { color }]}>{genreLabel(g)}</Text>
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
