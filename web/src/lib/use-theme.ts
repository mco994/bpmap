"use client";

import { useSyncExternalStore } from "react";
import { DEFAULT_THEME, THEME_ATTRIBUTE, themeFromAttribute, type Theme } from "@/lib/theme";

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
  return () => observer.disconnect();
}

function readCurrentTheme(): Theme {
  return themeFromAttribute(document.documentElement.getAttribute(THEME_ATTRIBUTE));
}

function readServerTheme(): Theme {
  return DEFAULT_THEME;
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeToTheme, readCurrentTheme, readServerTheme);
}
