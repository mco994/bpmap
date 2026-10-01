export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "bpmap-theme";
export const THEME_ATTRIBUTE = "data-theme";
export const DEFAULT_THEME: Theme = "light";
export const THEME_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#09090b",
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

export function readStoredTheme(storage: StorageLike | null | undefined): Theme {
  try {
    const stored = storage?.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeTheme(storage: StorageLike | null | undefined, theme: Theme): boolean {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
    return Boolean(storage);
  } catch {
    return false;
  }
}

export function themeFromAttribute(value: string | null | undefined): Theme {
  return value === "dark" ? "dark" : DEFAULT_THEME;
}

export function applyTheme(root: Element, theme: Theme): void {
  if (theme === "dark") {
    root.setAttribute(THEME_ATTRIBUTE, "dark");
  } else {
    root.removeAttribute(THEME_ATTRIBUTE);
  }
}

export function oppositeTheme(theme: Theme): Theme {
  return theme === "dark" ? "light" : "dark";
}

export const THEME_BOOTSTRAP_SCRIPT = [
  "(function(){try{",
  `if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==="dark"){`,
  `document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},"dark")`,
  "}}catch(e){}})();",
].join("");
