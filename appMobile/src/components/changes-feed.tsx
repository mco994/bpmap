import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { changeTypeLabel, type Change } from '@bpmap/shared';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { fetchChanges } from '@/lib/changes';

const DATE_FMT = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
});

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : DATE_FMT.format(d);
}

export function ChangesFeed({ followedIds }: { followedIds: Set<string> }) {
  const theme = useTheme();
  const router = useRouter();
  const [changes, setChanges] = useState<Change[]>([]);

  useEffect(() => {
    let active = true;
    fetchChanges()
      .then((all) => {
        if (active) setChanges(all.filter((c) => followedIds.has(c.festivalId)).slice(0, 10));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [followedIds]);

  if (changes.length === 0) return null;

  return (
    <View style={styles.container}>
      <ThemedText type="subtitle">Nouveautés</ThemedText>
      <View style={styles.list}>
        {changes.map((c) => (
          <Pressable
            key={c.id}
            onPress={() => router.push(`/festival/${c.festivalSlug}`)}
            style={[styles.card, { backgroundColor: theme.backgroundElement }]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.badge, { backgroundColor: theme.accentSoft }]}>
                <ThemedText type="small" style={{ color: theme.accent }}>
                  {changeTypeLabel(c.type)}
                </ThemedText>
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {formatDate(c.date)}
              </ThemedText>
            </View>
            <ThemedText type="smallBold">{c.festivalName}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {c.summary}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.three, gap: Spacing.two, marginBottom: Spacing.two },
  list: { gap: Spacing.two },
  card: { borderRadius: 12, padding: Spacing.three, gap: Spacing.half },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.three,
  },
});
