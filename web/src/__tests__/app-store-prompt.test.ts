import { describe, expect, it } from "vitest";
import { isSnoozed, SNOOZE_MS, storeForUserAgent } from "@/lib/app-store-prompt";

const ANDROID = "Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/128 Mobile";
const IPHONE = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/604.1";
const DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128";

describe("storeForUserAgent", () => {
  it("cible Google Play sur Android quand l'URL est définie", () => {
    expect(storeForUserAgent(ANDROID, { play: "https://play.example" })).toEqual({
      url: "https://play.example",
      label: "Google Play",
    });
  });

  it("ne propose rien sur Android sans URL Play", () => {
    expect(storeForUserAgent(ANDROID, { appStore: "https://apps.example" })).toBeNull();
  });

  it("cible l'App Store sur iPhone", () => {
    expect(storeForUserAgent(IPHONE, { appStore: "https://apps.example" })?.url).toBe(
      "https://apps.example",
    );
  });

  it("ne propose rien sur ordinateur", () => {
    expect(
      storeForUserAgent(DESKTOP, { play: "https://play.example", appStore: "https://apps.example" }),
    ).toBeNull();
  });
});

describe("isSnoozed", () => {
  const now = 1_700_000_000_000;

  it("est actif pendant sept jours après le refus", () => {
    expect(isSnoozed(String(now - SNOOZE_MS + 1), now)).toBe(true);
    expect(isSnoozed(String(now - SNOOZE_MS), now)).toBe(false);
  });

  it("ignore une valeur absente ou corrompue", () => {
    expect(isSnoozed(null, now)).toBe(false);
    expect(isSnoozed("abc", now)).toBe(false);
  });
});
