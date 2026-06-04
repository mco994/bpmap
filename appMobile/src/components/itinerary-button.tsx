import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Festival } from '@bpmap/shared';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { openDirections, suggestAddresses, type AddressSuggestion } from '@/lib/geo';

export function ItineraryButton({ festival }: { festival: Festival }) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [address, setAddress] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [picked, setPicked] = useState<AddressSuggestion | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const close = () => {
    setVisible(false);
    setSuggestions([]);
  };

  const go = async (origin?: string | { lat: number; lng: number }) => {
    close();
    try {
      await openDirections(festival, origin);
    } catch {
      Alert.alert('Itinéraire', "Impossible d'ouvrir l'application de cartes.");
    }
  };

  const onChangeAddress = (text: string) => {
    setAddress(text);
    setPicked(null);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSuggestions(await suggestAddresses(text));
    }, 300);
  };

  const pick = (s: AddressSuggestion) => {
    setAddress(s.label);
    setPicked(s);
    setSuggestions([]);
  };

  const goFromAddress = () => {
    if (picked) {
      void go({ lat: picked.lat, lng: picked.lng });
    } else if (address.trim()) {
      void go(address);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        style={[styles.action, { backgroundColor: theme.backgroundElement }]}
      >
        <Ionicons name="navigate-outline" size={16} color={theme.accent} />
        <ThemedText type="smallBold"> Itinéraire</ThemedText>
      </Pressable>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable style={styles.backdrop} onPress={close}>
            <Pressable onPress={() => {}}>
              <ThemedView style={styles.sheet}>
                <ThemedText type="subtitle">Itinéraire vers {festival.name}</ThemedText>

                <Pressable
                  onPress={() => go()}
                  style={[styles.primary, { backgroundColor: theme.accent }]}
                >
                  <Ionicons name="locate" size={16} color="#ffffff" />
                  <ThemedText type="smallBold" style={styles.primaryLabel}>
                    {' '}
                    Depuis ma position
                  </ThemedText>
                </Pressable>

                <ThemedText type="small" themeColor="textSecondary">
                  ou depuis une adresse
                </ThemedText>

                <TextInput
                  value={address}
                  onChangeText={onChangeAddress}
                  placeholder="Adresse de départ"
                  placeholderTextColor={theme.textSecondary}
                  returnKeyType="go"
                  onSubmitEditing={goFromAddress}
                  style={[styles.input, { color: theme.text, borderColor: theme.backgroundSelected }]}
                />

                {suggestions.length > 0 ? (
                  <View style={[styles.suggestions, { borderColor: theme.backgroundSelected }]}>
                    {suggestions.map((s) => (
                      <Pressable
                        key={s.label}
                        onPress={() => pick(s)}
                        style={({ pressed }) => [
                          styles.suggestion,
                          pressed && { backgroundColor: theme.backgroundElement },
                        ]}
                      >
                        <ThemedText type="small">{s.label}</ThemedText>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <Pressable
                  disabled={!address.trim()}
                  onPress={goFromAddress}
                  style={[
                    styles.primary,
                    { backgroundColor: theme.accentSoft, opacity: address.trim() ? 1 : 0.4 },
                  ]}
                >
                  <ThemedText type="smallBold" style={{ color: theme.accent }}>
                    Y aller depuis cette adresse
                  </ThemedText>
                </Pressable>
              </ThemedView>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Spacing.four,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    padding: Spacing.four,
    gap: Spacing.two,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  primary: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
  primaryLabel: { color: '#ffffff' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  suggestions: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Spacing.two,
    overflow: 'hidden',
  },
  suggestion: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
});
