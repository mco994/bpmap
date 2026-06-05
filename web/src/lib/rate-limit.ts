import { checkRateLimit } from "@vercel/firewall";

const RATE_LIMITED_MESSAGE =
  "Trop de requêtes. Merci de réessayer dans quelques instants.";

export async function enforceRateLimit(
  rateLimitId: string,
  request: Request,
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
    return null;
  }
}
