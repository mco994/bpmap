import { describe, expect, it } from "vitest";
import {
  DEFAULT_THEME,
  THEME_ATTRIBUTE,
  THEME_BOOTSTRAP_SCRIPT,
  THEME_STORAGE_KEY,
  applyTheme,
  isTheme,
  oppositeTheme,
  readStoredTheme,
  storeTheme,
  themeFromAttribute,
} from "@/lib/theme";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

function brokenStorage() {
  return {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("QuotaExceededError");
    },
  };
}

function fakeRoot() {
  const attributes = new Map<string, string>();
  return {
    attributes,
    setAttribute: (name: string, value: string) => {
      attributes.set(name, value);
    },
    removeAttribute: (name: string) => {
      attributes.delete(name);
    },
  } as unknown as Element & { attributes: Map<string, string> };
}

function runBootstrap(storage: { getItem: (key: string) => string | null }) {
  const root = fakeRoot();
  new Function("localStorage", "document", THEME_BOOTSTRAP_SCRIPT)(storage, {
    documentElement: root,
  });
  return root.attributes;
}

describe("thème — lecture mémorisée", () => {
  it("jour par défaut sans valeur mémorisée", () => {
    expect(DEFAULT_THEME).toBe("light");
    expect(readStoredTheme(memoryStorage())).toBe("light");
  });

  it("relit la valeur mémorisée", () => {
    expect(readStoredTheme(memoryStorage({ [THEME_STORAGE_KEY]: "dark" }))).toBe("dark");
    expect(readStoredTheme(memoryStorage({ [THEME_STORAGE_KEY]: "light" }))).toBe("light");
  });

  it("ignore une valeur inconnue", () => {
    expect(readStoredTheme(memoryStorage({ [THEME_STORAGE_KEY]: "auto" }))).toBe("light");
  });

  it("jour quand localStorage est indisponible ou lève une erreur", () => {
    expect(readStoredTheme(null)).toBe("light");
    expect(readStoredTheme(undefined)).toBe("light");
    expect(readStoredTheme(brokenStorage())).toBe("light");
  });
});

describe("thème — écriture", () => {
  it("mémorise le choix sous la clé bpmap-theme", () => {
    const storage = memoryStorage();
    expect(storeTheme(storage, "dark")).toBe(true);
    expect(storage.data.get("bpmap-theme")).toBe("dark");
  });

  it("reste silencieux quand localStorage lève une erreur", () => {
    expect(storeTheme(brokenStorage(), "dark")).toBe(false);
    expect(storeTheme(null, "dark")).toBe(false);
  });
});

describe("thème — attribut et bascule", () => {
  it("pose data-theme=dark en mode nuit et le retire en mode jour", () => {
    const root = fakeRoot();
    applyTheme(root, "dark");
    expect(root.attributes.get(THEME_ATTRIBUTE)).toBe("dark");
    applyTheme(root, "light");
    expect(root.attributes.has(THEME_ATTRIBUTE)).toBe(false);
  });

  it("dérive le thème de l'attribut, jour par défaut", () => {
    expect(themeFromAttribute("dark")).toBe("dark");
    expect(themeFromAttribute(null)).toBe("light");
    expect(themeFromAttribute("light")).toBe("light");
  });

  it("bascule entre jour et nuit", () => {
    expect(oppositeTheme("light")).toBe("dark");
    expect(oppositeTheme("dark")).toBe("light");
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("auto")).toBe(false);
  });
});

describe("thème — script d'amorçage", () => {
  it("pose l'attribut quand dark est mémorisé", () => {
    expect(runBootstrap({ getItem: () => "dark" }).get(THEME_ATTRIBUTE)).toBe("dark");
  });

  it("ne pose rien sans valeur ou en mode jour", () => {
    expect(runBootstrap({ getItem: () => null }).size).toBe(0);
    expect(runBootstrap({ getItem: () => "light" }).size).toBe(0);
  });

  it("reste silencieux quand localStorage lève une erreur", () => {
    expect(() => runBootstrap(brokenStorage())).not.toThrow();
    expect(runBootstrap(brokenStorage()).size).toBe(0);
  });

  it("ne contient aucune donnée dynamique ni balise", () => {
    expect(THEME_BOOTSTRAP_SCRIPT).toContain('"bpmap-theme"');
    expect(THEME_BOOTSTRAP_SCRIPT).not.toContain("<");
  });
});
