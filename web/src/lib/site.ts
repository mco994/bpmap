function fromEnvironment(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit;

  const vercelDomain =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ??
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelDomain) return `https://${vercelDomain}`;

  return null;
}

export const SITE_URL = (fromEnvironment() ?? "http://localhost:3000").replace(
  /\/+$/,
  "",
);

export function absoluteUrl(path: string): string {
  return path.startsWith("/") ? `${SITE_URL}${path}` : `${SITE_URL}/${path}`;
}

const LINE_SEPARATOR = 0x2028;
const PARAGRAPH_SEPARATOR = 0x2029;
const BACKSLASH = String.fromCharCode(0x5c);

const SCRIPT_UNSAFE = new RegExp(
  `[<>&${String.fromCharCode(LINE_SEPARATOR, PARAGRAPH_SEPARATOR)}]`,
  "g",
);

function escapeForScript(character: string): string {
  const code = character.charCodeAt(0).toString(16).padStart(4, "0");
  return `${BACKSLASH}u${code}`;
}

export function inlineJson(value: unknown): string {
  return JSON.stringify(value).replace(SCRIPT_UNSAFE, escapeForScript);
}
