import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, TextInput } from 'react-native';
import type { Festival } from '@bpmap/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { openDirections } from '@/lib/geo';

export function ItineraryButton({ festival }: { festival: Festival }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [address, setAddress] = useState('');

  const go = async (originText?: string) => {
    setVisible(false);
    try {
      await openDirections(festival, originText);
    } catch {
      Alert.alert('Itinéraire', "Impossible d'ouvrir l'application de cartes.");
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.action, { backgroundColor: theme.backgroundElement }]}
      >
        <ThemedText type="smallBold">🧭 Itinéraire</ThemedText>
      </Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setVisible(false)}>
          <Pressable onPress={() => {}}>
            <ThemedView style={styles.sheet}>
              <ThemedText type="subtitle">Itinéraire vers {festival.name}</ThemedText>

              <Pressable
                onPress={() => go()}
                style={[styles.primary, { backgroundColor: theme.backgroundSelected }]}
              >
                <ThemedText type="smallBold">📍 Depuis ma position</ThemedText>
              </Pressable>

              <ThemedText type="small" themeColor="textSecondary">
                ou depuis une adresse
              </ThemedText>

              <TextInput
                value={address}
                onChangeText={setAddress}
                placeholder="Adresse de départ"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="go"
                onSubmitEditing={() => {
                  if (address.trim()) void go(address);
                }}
                style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
              />

              <Pressable
                disabled={!address.trim()}
                onPress={() => go(address)}
                style={[
                  styles.primary,
                  { backgroundColor: theme.backgroundSelected, opacity: address.trim() ? 1 : 0.4 },
                ]}
              >
                <ThemedText type="smallBold">Y aller depuis cette adresse</ThemedText>
              </Pressable>
            </ThemedView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  action: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: Spacing.four,
    gap: Spacing.two,
    borderTopLeftRadius: Spacing.four,
    borderTopRightRadius: Spacing.four,
  },
  primary: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
