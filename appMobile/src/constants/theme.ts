
import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1C1024',
    background: '#FFFBFE',
    backgroundElement: '#F7EEF7',
    backgroundSelected: '#F0D9F2',
    textSecondary: '#6B5E74',
    accent: '#C026D3',
    accentStrong: '#DB2777',
    accentSoft: '#FAE8FF',
  },
  dark: {
    text: '#FDF4FF',
    background: '#120816',
    backgroundElement: '#241430',
    backgroundSelected: '#3B1D4F',
    textSecondary: '#C4B5CE',
    accent: '#E879F9',
    accentStrong: '#F472B6',
    accentSoft: '#3B0764',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
