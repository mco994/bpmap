import { afterEach, describe, expect, it, vi } from "vitest";
import { SITE_URL, absoluteUrl, inlineJson } from "@/lib/site";

describe("absoluteUrl", () => {
  it("préfixe toujours par l'origine du site", () => {
    expect(absoluteUrl("/festivals")).toBe(`${SITE_URL}/festivals`);
    expect(absoluteUrl("festivals")).toBe(`${SITE_URL}/festivals`);
  });

  it("ne laisse jamais de double barre oblique", () => {
    expect(absoluteUrl("/")).not.toContain("//festivals");
    expect(SITE_URL.endsWith("/")).toBe(false);
  });
});

describe("inlineJson", () => {
  it("empêche une sortie du contexte script", () => {
    const payload = { name: "Festival </script><script>alert(1)</script>" };
    const serialized = inlineJson(payload);
    expect(serialized).not.toContain("</script>");
    expect(serialized).not.toContain("<");
    expect(JSON.parse(serialized)).toEqual(payload);
  });

  it("échappe les séparateurs de ligne interdits en JavaScript", () => {
    const serialized = inlineJson({ text: "a\u2028b\u2029c" });
    expect(serialized).not.toContain("\u2028");
    expect(serialized).not.toContain("\u2029");
    expect(JSON.parse(serialized).text).toBe("a\u2028b\u2029c");
  });

  it("reste équivalent à JSON.parse pour des données ordinaires", () => {
    const payload = { a: 1, b: [true, null, "é"], c: { d: "x" } };
    expect(JSON.parse(inlineJson(payload))).toEqual(payload);
  });
});

describe("SITE_URL depuis NEXT_PUBLIC_SITE_URL", () => {
  async function loadSiteUrl(value: string): Promise<string> {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", value);
    vi.resetModules();
    const site = await import("@/lib/site");
    return site.SITE_URL;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("préfixe https:// quand le schéma manque", async () => {
    expect(await loadSiteUrl("bpmap.codale.fr")).toBe("https://bpmap.codale.fr");
    expect(() => new URL("bpmap.codale.fr")).toThrow();
  });

  it("conserve un schéma explicite", async () => {
    expect(await loadSiteUrl("https://bpmap.codale.fr")).toBe("https://bpmap.codale.fr");
    expect(await loadSiteUrl("http://localhost:3000")).toBe("http://localhost:3000");
  });

  it("retire la barre oblique finale", async () => {
    expect(await loadSiteUrl("https://bpmap.codale.fr/")).toBe("https://bpmap.codale.fr");
    expect(await loadSiteUrl("bpmap.codale.fr/")).toBe("https://bpmap.codale.fr");
  });
});
