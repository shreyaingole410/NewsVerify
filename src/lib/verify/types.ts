export type Verdict = "supported" | "likely_true" | "false" | "misleading" | "unverified";
export type Strength = "strong" | "moderate" | "weak" | "none";
export type RatingClass = "false" | "misleading" | "true" | "unknown";

export interface SourceItem {
  title: string;
  url: string;
  publisher: string;
  date?: string | undefined;
  snippet?: string | undefined;
  kind: "news" | "factcheck" | "wikipedia";
  /** Fact-check rating text exactly as published (or inferred from headline, marked as such). */
  rating?: string | undefined;
  ratingClass?: RatingClass | undefined;
  /** Share of claim keywords found in this item's title/text (0–1). */
  relevance: number;
}

export interface SourceStatus {
  name: string;
  status: "ok" | "failed" | "skipped";
  count: number;
  message?: string | undefined;
}

export interface ArticleInfo {
  url: string;
  canonical?: string | undefined;
  title?: string | undefined;
  publisher?: string | undefined;
  date?: string | undefined;
  excerpt?: string | undefined;
  claims: string[];
}

export interface VerificationResult {
  id: string;
  mode: "claim" | "article";
  claim: string;
  analyzedClaim: string;
  searchTerms: string[];
  article?: ArticleInfo | undefined;
  verdict: Verdict;
  strength: Strength;
  explanation: string;
  supporting: SourceItem[];
  contradicting: SourceItem[];
  factChecks: SourceItem[];
  related: SourceItem[];
  background: SourceItem[];
  sources: SourceStatus[];
  limitations: string[];
  createdAt: string;
}

export type VerifyResponse =
  | { ok: true; result: VerificationResult }
  | { ok: false; code: string; message: string; sources?: SourceStatus[] };
