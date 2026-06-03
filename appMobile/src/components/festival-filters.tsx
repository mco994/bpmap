import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
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
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';

const PRICE_PRESETS = [20, 40, 60, 100];

type Props = {
  value: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  resultCount: number;
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary">
        {title}
      </ThemedText>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? theme.backgroundSelected : theme.backgroundElement },
      ]}
    >
      <ThemedText type="small">{label}</ThemedText>
    </Pressable>
  );
}

export function FestivalFilters({ value, onChange, onReset, resultCount }: Props) {
  const theme = useTheme();

  const toggleEventType = (type: EventType) =>
    onChange({
      ...value,
      eventTypes: value.eventTypes.includes(type)
        ? value.eventTypes.filter((t) => t !== type)
        : [...value.eventTypes, type],
    });

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

  return (
    <ScrollView contentContainerStyle={styles.panel} showsVerticalScrollIndicator={false}>
      <Section title="Type">
        {EVENT_TYPES.map((t) => (
          <Chip
            key={t.type}
            label={t.label}
            active={value.eventTypes.includes(t.type)}
            onPress={() => toggleEventType(t.type)}
          />
        ))}
      </Section>

      <Section title="Genre">
        {GENRES.map((g) => (
          <Chip
            key={g.slug}
            label={g.label}
            active={value.genres.includes(g.slug)}
            onPress={() => toggleGenre(g.slug)}
          />
        ))}
      </Section>

      <Section title="Taille">
        {SIZE_TIERS.map((s) => (
          <Chip
            key={s.tier}
            label={s.label}
            active={value.sizes.includes(s.tier)}
            onPress={() => toggleSize(s.tier)}
          />
        ))}
      </Section>

      <Section title="Prix / jour">
        {PRICE_PRESETS.map((p) => (
          <Chip
            key={p}
            label={`≤ ${p} €`}
            active={value.priceDayMax === p}
            onPress={() => setPrice(p)}
          />
        ))}
      </Section>

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          Organisateur
        </ThemedText>
        <TextInput
          value={value.organizer}
          onChangeText={(text) => onChange({ ...value, organizer: text })}
          placeholder="Tous les organisateurs"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
        />
      </View>

      <View style={styles.switchRow}>
        <ThemedText type="small">Inclure les événements passés</ThemedText>
        <Switch
          value={value.includePast}
          onValueChange={(includePast) => onChange({ ...value, includePast })}
        />
      </View>

      <View style={styles.footer}>
        <ThemedText type="small" themeColor="textSecondary">
          {resultCount} événement{resultCount > 1 ? 's' : ''}
        </ThemedText>
        {!isEmptyFilters(value) ? (
          <Pressable onPress={onReset} hitSlop={8}>
            <ThemedText type="smallBold">Réinitialiser</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  panel: { padding: Spacing.three, gap: Spacing.three, paddingBottom: Spacing.six },
  section: { gap: Spacing.one },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
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
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
  },
});
