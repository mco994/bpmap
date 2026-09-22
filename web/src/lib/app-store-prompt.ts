export const SNOOZE_KEY = "bpmap-app-prompt-snoozed-at";
export const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

export type StoreLink = { url: string; label: string };

export function storeForUserAgent(
  userAgent: string,
  urls: { play?: string; appStore?: string },
): StoreLink | null {
  if (/android/i.test(userAgent)) {
    return urls.play ? { url: urls.play, label: "Google Play" } : null;
  }
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    return urls.appStore ? { url: urls.appStore, label: "l'App Store" } : null;
  }
  return null;
}

export function isSnoozed(snoozedAt: string | null, now: number): boolean {
  const at = Number(snoozedAt);
  return Number.isFinite(at) && at > 0 && now - at < SNOOZE_MS;
}
