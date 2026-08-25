import { describe, expect, it } from "vitest";
import {
  effectiveEventType,
  effectiveStatus,
  formatDateRange,
  formatFromPrice,
  formatPrice,
  genreLabel,
  isPast,
  isPurgeable,
  priceFrom,
  sizeTierForCapacity,
  statusLabel,
} from "../festivals";
import { makeFestival } from "./fixtures";

describe("sizeTierForCapacity", () => {
  it("classe chaque palier sur sa borne basse", () => {
    expect(sizeTierForCapacity(0)).toBe("S");
    expect(sizeTierForCapacity(4999)).toBe("S");
    expect(sizeTierForCapacity(5000)).toBe("M");
    expect(sizeTierForCapacity(14999)).toBe("M");
    expect(sizeTierForCapacity(15000)).toBe("L");
    expect(sizeTierForCapacity(49999)).toBe("L");
    expect(sizeTierForCapacity(50000)).toBe("XL");
  });

  it("rend null sans capacité connue", () => {
    expect(sizeTierForCapacity(null)).toBeNull();
  });
});

describe("formatDateRange", () => {
  it("replie une plage dans le même mois", () => {
    expect(formatDateRange("2026-07-10", "2026-07-12")).toBe("10 – 12 juillet 2026");
  });

  it("garde les deux mois quand la plage les traverse", () => {
    expect(formatDateRange("2026-07-30", "2026-08-02")).toBe("30 juillet – 2 août 2026");
  });

  it("n'affiche qu'une date quand début et fin coïncident", () => {
    expect(formatDateRange("2026-07-10", "2026-07-10")).toBe("10 juillet 2026");
  });

  it("se rabat sur un libellé quand une borne manque", () => {
    expect(formatDateRange(null, "2026-07-12")).toBe("Dates à confirmer");
    expect(formatDateRange("2026-07-10", null)).toBe("Dates à confirmer");
  });
});

describe("formatPrice / priceFrom", () => {
  it("distingue gratuit, inconnu et payant", () => {
    expect(formatPrice(0)).toBe("Gratuit");
    expect(formatPrice(null)).toBe("—");
    expect(formatPrice(35)).toBe("35 €");
  });

  it("retient le plus petit tarif, tarifs additionnels compris", () => {
    const festival = makeFestival({
      priceDay: 40,
      priceFull: 90,
      tariffs: [{ label: "Early bird", price: 25 }],
    });
    expect(priceFrom(festival)).toBe(25);
    expect(formatFromPrice(festival)).toBe("À partir de 25 €");
  });

  it("ignore les tarifs sans prix", () => {
    const festival = makeFestival({
      priceDay: null,
      priceFull: null,
      tariffs: [{ label: "Sur place", price: null }],
    });
    expect(priceFrom(festival)).toBeNull();
    expect(formatFromPrice(festival)).toBe("—");
  });

  it("annonce la gratuité plutôt qu'un tarif à zéro", () => {
    const festival = makeFestival({ priceDay: 0, priceFull: null });
    expect(formatFromPrice(festival)).toBe("Gratuit");
  });
});

describe("effectiveStatus", () => {
  const now = new Date(2026, 7, 25);

  it("bascule sur « passé » une fois la date de fin dépassée", () => {
    const festival = makeFestival({ endDate: "2026-08-24" });
    expect(effectiveStatus(festival, now)).toBe("passed");
    expect(isPast(festival, now)).toBe(true);
  });

  it("garde l'événement en cours jusqu'au bout de son dernier jour", () => {
    const festival = makeFestival({ startDate: "2026-08-24", endDate: "2026-08-25" });
    expect(effectiveStatus(festival, now)).toBe("confirmed");
    expect(isPast(festival, now)).toBe(false);
  });

  it("ne réécrit jamais une annulation", () => {
    const festival = makeFestival({ endDate: "2026-08-01", status: "cancelled" });
    expect(effectiveStatus(festival, now)).toBe("cancelled");
  });

  it("laisse les événements sans date de fin hors du passé", () => {
    const festival = makeFestival({ startDate: null, endDate: null });
    expect(effectiveStatus(festival, now)).toBe("confirmed");
  });
});

describe("isPurgeable", () => {
  const now = new Date(2026, 7, 25);

  it("ne purge qu'au-delà d'un mois révolu", () => {
    expect(isPurgeable(makeFestival({ endDate: "2026-07-24" }), now)).toBe(true);
    expect(isPurgeable(makeFestival({ endDate: "2026-07-26" }), now)).toBe(false);
  });

  it("ne purge jamais un événement sans date de fin", () => {
    expect(isPurgeable(makeFestival({ endDate: null }), now)).toBe(false);
  });
});

describe("libellés", () => {
  it("traduit les genres connus et retombe sur le slug sinon", () => {
    expect(genreLabel("drum-n-bass")).toBe("Drum'n'bass");
    expect(genreLabel("inconnu")).toBe("inconnu");
  });

  it("traduit les statuts", () => {
    expect(statusLabel("passed")).toBe("Passé");
  });

  it("considère « festival » comme type par défaut", () => {
    expect(effectiveEventType(makeFestival())).toBe("festival");
    expect(effectiveEventType(makeFestival({ eventType: "soiree" }))).toBe("soiree");
  });
});
