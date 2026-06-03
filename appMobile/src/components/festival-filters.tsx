import { ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Pressable } from 'react-native';
import {
  GENRES,
  SIZE_TIERS,
  EVENT_TYPES,
  isEmptyFilters,
  type Filters,
  type SizeTier,
  type EventType,
} from '@bpmap/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const PRICE_PRESETS = [20, 40, 60, 100];

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  resultCount: number;
};

export function FestivalFilters({ value, onChange, onReset, resultCount }: Props) {
  const theme = useTheme();

  const toggleGenre = (slug: string) =>
    onChange({
      ...value,
      genres: value.genres.includes(slug)
        ? value.genres.filter((g) => g !== slug)
        : [...value.genres, slug],
    });

  const toggleSize = (tier: SizeTier) =>
    onChange({
      ...value,
      sizes: value.sizes.includes(tier)
        ? value.sizes.filter((s) => s !== tier)
        : [...value.sizes, tier],
    });

  const setPrice = (max: number) =>
    onChange({ ...value, priceDayMax: value.priceDayMax === max ? null : max });

  const toggleEventType = (type: EventType) =>
    onChange({
      ...value,
      eventTypes: value.eventTypes.includes(type)
        ? value.eventTypes.filter((t) => t !== type)
        : [...value.eventTypes, type],
    });

  return (
    <ThemedView type="backgroundElement" style={styles.panel}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {EVENT_TYPES.map((t) => (
          <Chip
            key={t.type}
            label={t.label}
            active={value.eventTypes.includes(t.type)}
            onPress={() => toggleEventType(t.type)}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {GENRES.map((g) => (
          <Chip
            key={g.slug}
            label={g.label}
            active={value.genres.includes(g.slug)}
            onPress={() => toggleGenre(g.slug)}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {SIZE_TIERS.map((s) => (
          <Chip
            key={s.tier}
            label={s.label}
            active={value.sizes.includes(s.tier)}
            onPress={() => toggleSize(s.tier)}
          />
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {PRICE_PRESETS.map((p) => (
          <Chip
            key={p}
            label={`Jour ≤ ${p} €`}
            active={value.priceDayMax === p}
            onPress={() => setPrice(p)}
          />
        ))}
      </ScrollView>

      <TextInput
        value={value.organizer}
        onChangeText={(text) => onChange({ ...value, organizer: text })}
        placeholder="Organisateur"
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
      />

      <View style={styles.footer}>
        <View style={styles.switchRow}>
          <Switch
            value={value.includePast}
            onValueChange={(includePast) => onChange({ ...value, includePast })}
          />
          <ThemedText type="small">Inclure les passés</ThemedText>
        </View>

        <View style={styles.footerRight}>
          <ThemedText type="small" themeColor="textSecondary">
            {resultCount} festival{resultCount > 1 ? 's' : ''}
          </ThemedText>
          {!isEmptyFilters(value) ? (
            <Pressable onPress={onReset}>
              <ThemedText type="small">Réinitialiser</ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>
    </ThemedView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.backgroundSelected : theme.background },
      ]}
    >
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: { padding: Spacing.two, gap: Spacing.two },
  chips: { gap: Spacing.one, paddingRight: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.four,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.one },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
