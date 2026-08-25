export interface GenrePalette {
  light: { bg: string; fg: string };
  dark: { bg: string; fg: string };
  solid: string;
}

const FALLBACK: GenrePalette = {
  light: { bg: "#f6e1f9", fg: "#ac22bd" },
  dark: { bg: "#3d1b43", fg: "#d45ee2" },
  solid: "#c026d3",
};

export const GENRE_PALETTES: Record<string, GenrePalette> = {
  techno: {
    light: { bg: "#f6e1f9", fg: "#ac22bd" },
    dark: { bg: "#3d1b43", fg: "#d45ee2" },
    solid: "#c026d3",
  },
  house: {
    light: { bg: "#fef1dd", fg: "#996206" },
    dark: { bg: "#493517", fg: "#f59e0b" },
    solid: "#a36907",
  },
  "french-touch": {
    light: { bg: "#e4eefe", fg: "#0b61ee" },
    dark: { bg: "#202f4b", fg: "#5d98f8" },
    solid: "#1e6ff5",
  },
  "drum-n-bass": {
    light: { bg: "#def5ed", fg: "#0b7c56" },
    dark: { bg: "#163b31", fg: "#10b981" },
    solid: "#0c855d",
  },
  trance: {
    light: { bg: "#efe8fe", fg: "#763ff4" },
    dark: { bg: "#31274b", fg: "#a37ef8" },
    solid: "#8452f5",
  },
  psytrance: {
    light: { bg: "#e0f7e8", fg: "#157b3b" },
    dark: { bg: "#1a3e2a", fg: "#22c55e" },
    solid: "#178841",
  },
  "hard-techno": {
    light: { bg: "#f1dfdf", fg: "#991b1b" },
    dark: { bg: "#34191b", fg: "#e25c5c" },
    solid: "#991b1b",
  },
  hardstyle: {
    light: { bg: "#fde5e5", fg: "#d01212" },
    dark: { bg: "#472224", fg: "#f26a6a" },
    solid: "#eb1515",
  },
  electro: {
    light: { bg: "#fce5f1", fg: "#c8156e" },
    dark: { bg: "#472337", fg: "#ef64a8" },
    solid: "#e0177a",
  },
  minimal: {
    light: { bg: "#e9ecef", fg: "#5b6a7f" },
    dark: { bg: "#292c34", fg: "#8896a9" },
    solid: "#64748b",
  },
  edm: {
    light: { bg: "#dcf5f9", fg: "#04768a" },
    dark: { bg: "#143b44", fg: "#06b6d4" },
    solid: "#047f94",
  },
  disco: {
    light: { bg: "#feebde", fg: "#b44c05" },
    dark: { bg: "#4a2c1a", fg: "#f9761b" },
    solid: "#c35305",
  },
  dub: {
    light: { bg: "#eef8de", fg: "#4e790d" },
    dark: { bg: "#30401a", fg: "#84cc16" },
    solid: "#54820e",
  },
  dubstep: {
    light: { bg: "#e9eafd", fg: "#5054ef" },
    dark: { bg: "#29294a", fg: "#888bf4" },
    solid: "#5e61f1",
  },
  ambient: {
    light: { bg: "#def5f3", fg: "#0d786c" },
    dark: { bg: "#173b3a", fg: "#14b8a6" },
    solid: "#0e8174",
  },
};

export function genrePalette(slug: string): GenrePalette {
  return GENRE_PALETTES[slug] ?? FALLBACK;
}

export function genreColor(slug: string): string {
  return genrePalette(slug).solid;
}
