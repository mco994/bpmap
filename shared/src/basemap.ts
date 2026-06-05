const COUNTRY_LABELS_TO_HIDE = ["Andorra", "Monaco"];

type StyleLayer = {
  id: string;
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

export function isCountryLabelLayer(layer: { id: string }): boolean {
  return layer.id.startsWith("label_country");
}

export function maskedCountryLabelFilter(current: unknown): unknown[] {
  return current
    ? ["all", current, countryLabelExclusion()]
    : ["all", countryLabelExclusion()];
}

export function hideEnclaveCountryLabels(style: StyleDocument): StyleDocument {
  return {
    ...style,
    layers: (style.layers ?? []).map((layer) =>
      isCountryLabelLayer(layer)
        ? { ...layer, filter: maskedCountryLabelFilter(layer.filter) }
        : layer,
    ),
  };
}
