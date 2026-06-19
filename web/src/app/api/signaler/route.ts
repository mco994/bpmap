import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const MAX_SLUG = 120;
const MAX_MESSAGE = 2000;
const MAX_EMAIL = 200;
const SLUG_PATTERN = /^[a-z0-9-]{1,120}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CONTROL_CHARS = new RegExp("[\\x00-\\x1f\\x7f]", "g");
const NEWLINES = new RegExp("[\\r\\n]+", "g");

function stripControl(value: string): string {
  return value.replace(CONTROL_CHARS, " ").trim();
}

function headerSafe(value: string): string {
  return value.replace(NEWLINES, " ").replace(CONTROL_CHARS, " ").trim();
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit("api-signaler", request);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const { slug, message, email } = (body ?? {}) as {
    slug?: unknown;
    message?: unknown;
    email?: unknown;
  };

  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
    return Response.json({ error: "Festival invalide." }, { status: 400 });
  }
  if (
    typeof message !== "string" ||
    message.trim().length === 0 ||
    message.length > MAX_MESSAGE
  ) {
    return Response.json({ error: "Message invalide." }, { status: 400 });
  }
  if (
    email !== undefined &&
    (typeof email !== "string" ||
      email.length > MAX_EMAIL ||
      !EMAIL_PATTERN.test(email))
  ) {
    return Response.json({ error: "Email invalide." }, { status: 400 });
  }

  const safeSlug = slug.slice(0, MAX_SLUG);
  const safeMessage = stripControl(message).slice(0, MAX_MESSAGE);
  const safeEmail = email ? headerSafe(email).slice(0, MAX_EMAIL) : null;
  const replyTo = safeEmail && EMAIL_PATTERN.test(safeEmail) ? safeEmail : undefined;

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  const from = process.env.REPORT_EMAIL_FROM;

  if (!apiKey || !to || !from) {
    console.warn(`[signaler] ${safeSlug} — ${safeMessage}`);
    return Response.json({ ok: true });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        reply_to: replyTo,
        subject: `Signalement — ${safeSlug}`,
        text: [
          `Festival : ${safeSlug}`,
          `Email : ${safeEmail ?? "non fourni"}`,
          "",
          safeMessage,
        ].join("\n"),
      }),
    });
    if (!res.ok) throw new Error(`Resend ${res.status}`);
  } catch {
    return Response.json(
      { error: "L'envoi a échoué. Merci de réessayer plus tard." },
      { status: 502 },
    );
  }

  return Response.json({ ok: true });
}
