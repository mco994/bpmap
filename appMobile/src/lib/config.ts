import Constants from 'expo-constants';

const DEFAULT_API_URL = 'https://bpmap.vercel.app';

function devApiUrl(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants.expoGoConfig as { debuggerHost?: string } | undefined)?.debuggerHost;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0];
  if (!host) return null;
  return `http://${host}:3000`;
}

export function apiBaseUrl(): string {
  if (__DEV__) {
    const dev = devApiUrl();
    if (dev) return dev;
  }
  const configured = Constants.expoConfig?.extra?.apiUrl;
  return typeof configured === 'string' && configured.length > 0
    ? configured
    : DEFAULT_API_URL;
}
