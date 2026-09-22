import { checkRateLimit } from "@vercel/firewall";

const RATE_LIMITED_MESSAGE =
  "Trop de requêtes. Merci de réessayer dans quelques instants.";
const UNAVAILABLE_MESSAGE =
  "Service momentanément indisponible. Merci de réessayer plus tard.";

export async function enforceRateLimit(
  rateLimitId: string,
  request: Request,
  { failClosed = false }: { failClosed?: boolean } = {},
): Promise<Response | null> {
  try {
    const { rateLimited } = await checkRateLimit(rateLimitId, {
      request,
    });

    if (rateLimited) {
      return Response.json(
        { error: RATE_LIMITED_MESSAGE },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        },
      );
    }

    return null;
  } catch {
    if (!failClosed) return null;
    return Response.json({ error: UNAVAILABLE_MESSAGE }, { status: 503 });
  }
}
