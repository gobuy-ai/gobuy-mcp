import { describe, expect, it } from "vitest";
import { GoBuyApi, UpstreamError } from "./api.js";

describe("GoBuy API adapter", () => {
  it("builds the public score request and returns its body", async () => {
    const fetcher = async (input: string | URL | Request) => {
      expect(String(input)).toContain("/api/gobuy/extension/score?retailer=amazon&productId=B012345678");
      return new Response(JSON.stringify({
        state: "not_indexed",
        source: "database",
        retailer: "Amazon",
        retailerProductId: "B012345678",
        product: null,
      }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const result = await new GoBuyApi("https://example.test", fetcher as typeof fetch)
      .score({ retailer: "amazon", product_id: "B012345678" });
    expect(result.state).toBe("not_indexed");
  });

  it("turns non-success responses into explicit upstream errors", async () => {
    const fetcher = async () => new Response(JSON.stringify({ error: "Unavailable" }), {
      status: 503,
      headers: { "content-type": "application/json" },
    });
    await expect(new GoBuyApi("https://example.test", fetcher as typeof fetch)
      .score({ retailer: "amazon", product_id: "B012345678" }))
      .rejects.toEqual(expect.objectContaining<Partial<UpstreamError>>({ status: 503, message: "Unavailable" }));
  });
});