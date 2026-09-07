import type { ProductReference, ScoreResponse } from "./types.js";

export class UpstreamError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export class GoBuyApi {
  constructor(private readonly baseUrl: string, private readonly fetcher: typeof fetch = fetch) {}

  async score(ref: ProductReference): Promise<ScoreResponse> {
    const url = new URL("/api/gobuy/extension/score", this.baseUrl);
    url.searchParams.set("retailer", ref.retailer);
    url.searchParams.set("productId", ref.product_id);
    const response = await this.fetcher(url, { headers: { accept: "application/json" } });
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      throw new UpstreamError(response.status, String(body.error ?? `GoBuy API returned HTTP ${response.status}`));
    }
    return body as unknown as ScoreResponse;
  }
}