import { describe, expect, it } from "vitest";
import { mapScore, rankProducts, verdict } from "./trust.js";

describe("trust mapping", () => {
  it("maps score tiers", () => {
    expect(verdict(80)).toBe("strong_evidence");
    expect(verdict(65)).toBe("moderate_evidence");
    expect(verdict(55)).toBe("limited_evidence");
    expect(verdict(20)).toBe("evidence_concerns");
  });
  it("maps and ranks indexed products above absent products", () => {
    const ref = { retailer: "amazon" as const, product_id: "B012345678" };
    const indexed = mapScore(ref, { state: "indexed", source: "database", retailer: "Amazon", retailerProductId: ref.product_id, product: { retailerProductId: ref.product_id, summary: { score: 77 }, evidence: { observed: [{ signal: "reviews" }], missing: ["price_history"] } } });
    const missing = mapScore({ ...ref, product_id: "B000000000" }, { state: "not_indexed", source: "database", retailer: "Amazon", retailerProductId: "B000000000", product: null });
    expect(indexed.signal_breakdown.missing).toEqual(["price_history"]);
    expect(rankProducts([missing, indexed])[0].evidence_score).toBe(77);
  });
});