import { describe, expect, it } from "vitest";
import { changeTypeLabel, diffFestivals } from "../changes";
import { makeFestival } from "./fixtures";

const DATE = "2026-08-25";

describe("diffFestivals", () => {
  it("ne rapporte rien entre deux jeux identiques", () => {
    const festivals = [makeFestival()];
    expect(diffFestivals(festivals, festivals, DATE)).toEqual([]);
  });

  it("signale un ajout avec sa ville et ses dates", () => {
    const added = makeFestival({ id: "new", city: "Nantes" });
    const [change] = diffFestivals([], [added], DATE);
    expect(change.type).toBe("added");
    expect(change.summary).toContain("Nantes");
    expect(change.id).toBe(`${DATE}:new:added`);
  });

  it("signale un retrait", () => {
    const [change] = diffFestivals([makeFestival()], [], DATE);
    expect(change.type).toBe("removed");
    expect(change.festivalSlug).toBe("festival-test");
  });

  it("détecte un changement de dates", () => {
    const before = makeFestival();
    const after = makeFestival({ startDate: "2026-07-17", endDate: "2026-07-19" });
    const types = diffFestivals([before], [after], DATE).map((c) => c.type);
    expect(types).toEqual(["dates"]);
  });

  it("détecte un changement de tarif, tarifs additionnels compris", () => {
    const before = makeFestival();
    const after = makeFestival({ tariffs: [{ label: "Early", price: 20 }] });
    expect(diffFestivals([before], [after], DATE).map((c) => c.type)).toEqual(["price"]);
  });

  it("ignore une simple réorganisation du line-up", () => {
    const before = makeFestival({ lineup: ["A", "B"] });
    const after = makeFestival({ lineup: ["B", "A"] });
    expect(diffFestivals([before], [after], DATE)).toEqual([]);
  });

  it("détecte un vrai ajout au line-up", () => {
    const before = makeFestival({ lineup: ["A"] });
    const after = makeFestival({ lineup: ["A", "B"] });
    expect(diffFestivals([before], [after], DATE).map((c) => c.type)).toEqual(["lineup"]);
  });

  it("décrit la transition de statut en clair", () => {
    const before = makeFestival({ status: "announced" });
    const after = makeFestival({ status: "cancelled" });
    const [change] = diffFestivals([before], [after], DATE);
    expect(change.type).toBe("status");
    expect(change.summary).toBe("Statut : Annoncé → Annulé.");
  });

  it("cumule plusieurs changements sur un même événement", () => {
    const before = makeFestival();
    const after = makeFestival({ startDate: "2026-08-01", endDate: "2026-08-03", priceFull: 120 });
    const types = diffFestivals([before], [after], DATE).map((c) => c.type).sort();
    expect(types).toEqual(["dates", "price"]);
  });

  it("produit un identifiant stable, rejouable sans doublon", () => {
    const before = [makeFestival()];
    const after = [makeFestival({ priceFull: 120 })];
    const first = diffFestivals(before, after, DATE);
    const second = diffFestivals(before, after, DATE);
    expect(first[0].id).toBe(second[0].id);
  });
});

describe("changeTypeLabel", () => {
  it("libelle chaque type de changement", () => {
    expect(changeTypeLabel("added")).toBe("Nouvel événement");
    expect(changeTypeLabel("lineup")).toBe("Line-up mis à jour");
  });
});
