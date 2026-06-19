const COUNTRY_LABELS_TO_HIDE = ["Andorra", "Monaco"];

const FOREIGN_PLACE_LABELS_TO_HIDE = [
  "Geneva", "Genève", "Genf",
  "Lausanne", "Basel", "Bâle", "Basle",
  "Bern", "Berne", "Zürich", "Zurich", "Lugano", "Sion",
  "Neuchâtel", "Fribourg", "Biel/Bienne", "La Chaux-de-Fonds",
  "Montreux", "Vevey", "Nyon", "Yverdon-les-Bains", "Winterthur",
  "Turin", "Torino", "Genoa", "Genova", "Aosta", "Aoste",
  "Milan", "Milano", "Cuneo", "Ventimiglia", "Vintimille",
  "Imperia", "Sanremo", "San Remo", "Asti", "Alessandria", "Savona", "Novara",
  "Barcelona", "Barcelone", "Girona", "Gerona", "Gérone",
  "San Sebastián", "Donostia", "Saint-Sébastien", "Bilbao",
  "Pamplona", "Pampelune", "Iruña", "Figueres", "Figueras",
  "Huesca", "Zaragoza", "Saragosse", "Lleida", "Lérida",
  "Vitoria-Gasteiz", "Vitoria", "Logroño",
  "Saarbrücken", "Sarrebruck", "Freiburg", "Freiburg im Breisgau",
  "Fribourg-en-Brisgau", "Karlsruhe", "Stuttgart", "Mannheim",
  "Trier", "Trèves", "Kaiserslautern", "Offenburg", "Heidelberg", "Pforzheim",
  "Brussels", "Bruxelles", "Brussel", "Charleroi", "Mons", "Bergen",
  "Liège", "Lüttich", "Luik", "Namur", "Namen", "Tournai", "Doornik",
  "Gent", "Ghent", "Gand", "Antwerp", "Antwerpen", "Anvers",
  "Bruges", "Brugge", "Mouscron", "Kortrijk", "Courtrai", "Arlon",
  "Luxembourg", "Luxemburg", "Esch-sur-Alzette", "Differdange", "Dudelange",
  "Andorra la Vella", "Andorre-la-Vieille",
  "Monaco", "Monte-Carlo",
];

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

function nameInForeignList(field: string): unknown[] {
  return ["in", ["get", field], ["literal", FOREIGN_PLACE_LABELS_TO_HIDE]];
}

function foreignPlaceExclusion(): unknown[] {
  return [
    "!",
    [
      "any",
      nameInForeignList("name:latin"),
      nameInForeignList("name_en"),
      nameInForeignList("name"),
    ],
  ];
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
    ? ["all", current, foreignPlaceExclusion()]
    : ["all", foreignPlaceExclusion()];
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
