import { franceWithinGeometry } from "./france";

const COUNTRY_LABELS_TO_HIDE = ["Andorra", "Monaco"];

type StyleLayer = {
  id: string;
  type?: string;
  layout?: Record<string, unknown>;
  filter?: unknown;
  [key: string]: unknown;
};

type StyleDocument = {
  layers?: StyleLayer[];
  [key: string]: unknown;
};

function countryLabelExclusion(): unknown[] {
  return [
    "!",
    [
      "in",
      ["coalesce", ["get", "name:latin"], ["get", "name"]],
      ["literal", COUNTRY_LABELS_TO_HIDE],
    ],
  ];
}

function withinFrance(): unknown[] {
  return ["within", franceWithinGeometry()];
}

export function isCountryLabelLayer(layer: { id: string }): boolean {
  return layer.id.startsWith("label_country");
}

export function isCityLabelLayer(layer: { id: string }): boolean {
  return layer.id === "label_city" || layer.id === "label_city_capital";
}

export function maskedCountryLabelFilter(current: unknown): unknown[] {
  return current
    ? ["all", current, countryLabelExclusion()]
    : ["all", countryLabelExclusion()];
}

export function maskedPlaceLabelFilter(current: unknown): unknown[] {
  return current
    ? ["all", current, withinFrance()]
    : ["all", withinFrance()];
}

export function hideEnclaveCountryLabels(style: StyleDocument): StyleDocument {
  return {
    ...style,
    layers: (style.layers ?? []).map((layer) => {
      if (isCountryLabelLayer(layer)) {
        return { ...layer, layout: { ...layer.layout, visibility: "none" } };
      }
      if (isCityLabelLayer(layer)) {
        return { ...layer, filter: maskedPlaceLabelFilter(layer.filter) };
      }
      return layer;
    }),
  };
}
