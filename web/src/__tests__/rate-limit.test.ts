import { describe, expect, it, vi } from "vitest";

const { checkRateLimit } = vi.hoisted(() => ({ checkRateLimit: vi.fn() }));
vi.mock("@vercel/firewall", () => ({ checkRateLimit }));

const { enforceRateLimit } = await import("@/lib/rate-limit");
const request = new Request("http://localhost/api/test");

describe("enforceRateLimit", () => {
  it("laisse passer quand le firewall ne limite pas", async () => {
    checkRateLimit.mockResolvedValueOnce({ rateLimited: false });
    expect(await enforceRateLimit("api-test", request)).toBeNull();
  });

  it("répond 429 quand le firewall limite", async () => {
    checkRateLimit.mockResolvedValueOnce({ rateLimited: true });
    const res = await enforceRateLimit("api-test", request);
    expect(res?.status).toBe(429);
  });

  it("échoue ouvert par défaut quand le firewall est injoignable", async () => {
    checkRateLimit.mockImplementationOnce(async () => {
      throw new Error("down");
    });
    expect(await enforceRateLimit("api-test", request)).toBeNull();
  });

  it("échoue fermé (503) quand la route l'exige", async () => {
    checkRateLimit.mockImplementationOnce(async () => {
      throw new Error("down");
    });
    const res = await enforceRateLimit("api-test", request, { failClosed: true });
    expect(res?.status).toBe(503);
  });
});
