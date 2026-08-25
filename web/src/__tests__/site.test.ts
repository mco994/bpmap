import { describe, expect, it } from "vitest";
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
