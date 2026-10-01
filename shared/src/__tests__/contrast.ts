function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function blend(foreground: string, background: string, alpha: number): string {
  return `#${[1, 3, 5]
    .map((i) => {
      const fg = parseInt(foreground.slice(i, i + 2), 16);
      const bg = parseInt(background.slice(i, i + 2), 16);
      return Math.round(fg * alpha + bg * (1 - alpha))
        .toString(16)
        .padStart(2, "0");
    })
    .join("")}`;
}
