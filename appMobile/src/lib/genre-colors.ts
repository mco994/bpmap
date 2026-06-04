const GENRE_COLORS: Record<string, string> = {
  techno: '#C026D3',
  house: '#F59E0B',
  'french-touch': '#3B82F6',
  'drum-n-bass': '#10B981',
  trance: '#8B5CF6',
  psytrance: '#22C55E',
  'hard-techno': '#991B1B',
  hardstyle: '#EF4444',
  electro: '#EC4899',
  minimal: '#64748B',
  edm: '#06B6D4',
  disco: '#F97316',
  dub: '#84CC16',
  dubstep: '#6366F1',
  ambient: '#14B8A6',
};

export function genreColor(slug: string): string {
  return GENRE_COLORS[slug] ?? '#C026D3';
}

export function withAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}
