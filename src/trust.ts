import type { IndexedProduct, ProductReference, ScoreResponse } from "./types.js";

export const EVIDENCE_NOTICE =
  "Evidence Scores describe available marketplace records, not product quality, safety, value, suitability, seller legitimacy, or a purchase recommendation.";

export function verdict(score: number): "strong_evidence" | "moderate_evidence" | "limited_evidence" | "evidence_concerns" {
  if (score >= 75) return "strong_evidence";
  if (score >= 60) return "moderate_evidence";
  if (score >= 50) return "limited_evidence";
  return "evidence_concerns";
}

export function mapScore(ref: ProductReference, response: ScoreResponse) {
  if (!response.product) {
    return {
      retailer: ref.retailer,
      product_id: ref.product_id,
      state: response.state,
      evidence_score: null,
      verdict: "unverified",
      evidence_notice: EVIDENCE_NOTICE,
      error: response.error ?? null,
    };
  }

  const product: IndexedProduct = response.product;
  return {
    retailer: ref.retailer,
    product_id: ref.product_id,
    state: response.state,
    product: {
      name: product.name ?? null,
      brand: product.brand ?? null,
      rating: product.rating ?? null,
      review_count: product.reviewCount ?? null,
      price: product.price ?? null,
      availability: product.availability ?? "unknown",
      image_url: product.imageUrl ?? null,
      buy_url: product.buyUrl ?? null,
    },
    evidence_score: product.summary.score,
    verdict: verdict(product.summary.score),
    summary: product.summary.text ?? null,
    signal_breakdown: {
      observed: product.evidence?.observed ?? [],
      missing: product.evidence?.missing ?? [],
    },
    formula_version: product.formulaVersion ?? null,
    freshness: product.freshness ?? null,
    evidence_notice: EVIDENCE_NOTICE,
  };
}

export function rankProducts(results: ReturnType<typeof mapScore>[]) {
  return [...results]
    .sort((a, b) => (b.evidence_score ?? -1) - (a.evidence_score ?? -1))
    .map((result, index) => ({ rank: index + 1, ...result }));
}