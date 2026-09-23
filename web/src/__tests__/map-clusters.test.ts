import { describe, expect, it } from "vitest";
import type { Festival } from "@bpmap/shared";
import {
  clusterByScreenDistance,
  mergeDistance,
  projectMercator,
  radiusAtZoom,
  GROUP_RADII,
  SINGLE_RADII,
} from "@/lib/map-clusters";

function at(id: string, lng: number, lat: number): Festival {
  return {
    id,
    slug: id,
    name: id,
    description: "",
    startDate: "2026-07-10",
    endDate: "2026-07-12",
    lat,
    lng,
    city: "Ville",
    region: "Région",
    organizer: null,
    capacity: null,
    genres: ["techno"],
    priceDay: null,
    priceFull: null,
    currency: "EUR",
    ticketUrl: null,
    officialUrl: null,
    status: "confirmed",
  };
}

/** Décale un point de `pixels` vers l'est au zoom donné, sans passer par la carte. */
function shiftedByPixels(lng: number, lat: number, zoom: number, pixels: number) {
  const worldSize = 512 * 2 ** zoom;
  return lng + (pixels / worldSize) * 360;
}

describe("radiusAtZoom", () => {
  it("borne aux extrémités et interpole entre les paliers", () => {
    expect(radiusAtZoom(2, GROUP_RADII)).toBe(GROUP_RADII[0]);
    expect(radiusAtZoom(20, GROUP_RADII)).toBe(GROUP_RADII[GROUP_RADII.length - 1]);
    expect(radiusAtZoom(5, GROUP_RADII)).toBe(8);
    expect(radiusAtZoom(5, SINGLE_RADII)).toBeCloseTo(5.25, 5);
  });
});

describe("mergeDistance", () => {
  it("vaut le rayon du groupe moins un demi-rayon de point isolé", () => {
    expect(mergeDistance(4)).toBeCloseTo(7 - 4.5 / 2, 5);
    expect(mergeDistance(9)).toBeCloseTo(12 - 7.5 / 2, 5);
  });

  it("s'élargit avec le zoom, puisque les pastilles grossissent", () => {
    expect(mergeDistance(9)).toBeGreaterThan(mergeDistance(4));
  });
});

describe("projectMercator", () => {
  it("place le méridien de Greenwich au milieu du monde", () => {
    const world = 512 * 2 ** 4;
    expect(projectMercator(0, 0, 4).x).toBeCloseTo(world / 2, 5);
    expect(projectMercator(0, 0, 4).y).toBeCloseTo(world / 2, 5);
  });
});

describe("clusterByScreenDistance", () => {
  const zoom = 4;

  it("fusionne deux événements au même endroit", () => {
    const a = at("a", 2.35, 48.85);
    const b = at("b", 2.35, 48.85);
    const { membersOf, anchorOf } = clusterByScreenDistance([a, b], zoom);
    expect(anchorOf.b).toBe("a");
    expect(membersOf.a).toHaveLength(2);
    expect(membersOf.b).toBeUndefined();
  });

  it("avale un point qui dépasserait de moins d'un quart", () => {
    const a = at("a", 2.35, 48.85);
    const near = at("near", shiftedByPixels(2.35, 48.85, zoom, mergeDistance(zoom) - 0.5), 48.85);
    const { anchorOf } = clusterByScreenDistance([a, near], zoom);
    expect(anchorOf.near).toBe("a");
  });

  it("laisse visible un point qui dépasse d'au moins un quart", () => {
    const a = at("a", 2.35, 48.85);
    const far = at("far", shiftedByPixels(2.35, 48.85, zoom, mergeDistance(zoom) + 0.5), 48.85);
    const { anchorOf, membersOf } = clusterByScreenDistance([a, far], zoom);
    expect(anchorOf.far).toBe("far");
    expect(membersOf.a).toHaveLength(1);
    expect(membersOf.far).toHaveLength(1);
  });

  it("défait un groupe quand on zoome", () => {
    const a = at("a", 2.35, 48.85);
    const b = at("b", shiftedByPixels(2.35, 48.85, 4, 4), 48.85);
    expect(clusterByScreenDistance([a, b], 4).anchorOf.b).toBe("a");
    expect(clusterByScreenDistance([a, b], 12).anchorOf.b).toBe("b");
  });

  it("ne perd aucun événement", () => {
    const all = [at("a", 2.35, 48.85), at("b", 2.35, 48.85), at("c", -1.68, 48.11)];
    const { anchorOf, membersOf } = clusterByScreenDistance(all, zoom);
    expect(Object.keys(anchorOf)).toHaveLength(3);
    expect(Object.values(membersOf).flat()).toHaveLength(3);
  });
});
