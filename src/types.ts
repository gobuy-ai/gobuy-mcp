export const RETAILERS = ["amazon", "walmart", "target", "bestbuy"] as const;
export type Retailer = (typeof RETAILERS)[number];

export interface ProductReference {
  retailer: Retailer;
  product_id: string;
}

export interface EvidenceSignal {
  signal: string;
  value?: unknown;
  detail?: string;
}

export interface IndexedProduct {
  retailerProductId: string;
  name?: string | null;
  brand?: string | null;
  imageUrl?: string | null;
  buyUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  price?: number | null;
  availability?: string;
  summary: { score: number; label?: string; text?: string | null };
  formulaVersion?: string;
  evidence?: { observed?: EvidenceSignal[]; missing?: string[] };
  freshness?: { computedAt?: string; staleAt?: string };
}

export interface ScoreResponse {
  state: "indexed" | "stale" | "not_indexed" | "temporary_source_error";
  source: string;
  retailer: string;
  retailerProductId: string;
  product: IndexedProduct | null;
  error?: { code?: string; message?: string };
}