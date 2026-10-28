import type { RatingClass, SourceItem, Strength, Verdict } from "./types";

const STOP = new Set(
  "the and for are was were has have had that this with from they their there been will would could should about into than then them these those which while what when where who whom whose why how its it's not but all any can did does doing just more most other over same some such only own very also after before under again once here both each few nor off out per our ours you your yours his her hers him she he we us i me my is be am an a of to in on at by as or if so do no yes up via said says say new news report reports reported according claim claims claimed viral video photo shows show image".split(
    " ",
  ),
);

const stem = (w: string) => (w.length > 4 && w.endsWith("s") && !w.endsWith("ss") ? w.slice(0, -1) : w);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map(stem);
}

export function keywords(text: string, max = 8): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of tokenize(text)) {
    if ((w.length > 2 || /^\d+$/.test(w)) && !STOP.has(w) && !seen.has(w)) {
      seen.add(w);
      out.push(w);
    }
  }
  return out.slice(0, max);
}

/** Fraction of claim keywords that appear in the text. */
export function relevance(claimKw: string[], text: string): number {
  if (!claimKw.length) return 0;
  const set = new Set(tokenize(text));
  return claimKw.filter((k) => set.has(k)).length / claimKw.length;
}

/** For long input, pick the first substantial sentence as the central claim. */
export function mainClaim(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= 280) return t;
  const sentences = t.split(/(?<=[.!?])\s+/);
  return (sentences.find((s) => s.length >= 40) ?? sentences[0] ?? t).slice(0, 280);
}

export function normalizeRating(rating: string | undefined): RatingClass {
  if (!rating) return "unknown";
  const r = rating.toLowerCase();
  if (/(misleading|missing context|out of context|lacks context|needs context|partly|partially|half[- ]true|mixture|mixed|exaggerat|distort|cherry)/.test(r))
    return "misleading";
  if (/(pants on fire|false|fake|incorrect|not true|untrue|hoax|fabricat|debunk|baseless|no evidence|wrong|scam|altered|doctored|satire)/.test(r))
    return "false";
  if (/(\btrue\b|correct|accurate|verified|confirmed)/.test(r)) return "true";
  return "unknown";
}

const DEBUNK_TERMS = [
  "fake", "false", "hoax", "debunk", "debunked", "misleading", "no evidence", "not true", "baseless",
  "rumour", "rumor", "untrue", "fabricated", "doctored", "misinformation", "disinformation", "denies", "denied",
];

/** Debunk terms in a headline, ignoring words the claim itself uses (e.g. a claim that something "is fake"). */
export function debunkSignals(title: string, claim: string): string[] {
  const claimTokens = new Set(tokenize(claim));
  const t = ` ${tokenize(title).join(" ")} `;
  return DEBUNK_TERMS.filter((term) => {
    const parts = tokenize(term);
    if (parts.every((p) => claimTokens.has(p))) return false;
    return t.includes(` ${parts.join(" ")} `);
  });
}

/** Infer a false/misleading rating from a fact-check headline. Never infers "true" from headlines. */
export function inferHeadlineRating(title: string, claim: string): { rating?: string; ratingClass: RatingClass } {
  const claimTokens = new Set(tokenize(claim));
  const reduced = tokenize(title).filter((w) => !claimTokens.has(w)).join(" ");
  const cls = normalizeRating(reduced);
  if (cls === "false") return { rating: "False (inferred from headline)", ratingClass: "false" };
  if (cls === "misleading") return { rating: "Misleading (inferred from headline)", ratingClass: "misleading" };
  return { ratingClass: "unknown" };
}

const REPUTABLE = [
  "reuters", "associated press", "ap news", "bbc", "npr", "the guardian", "guardian", "new york times", "nytimes",
  "washington post", "wall street journal", "wsj", "bloomberg", "al jazeera", "cnn", "abc news", "cbs news", "nbc news",
  "the hindu", "indian express", "hindustan times", "times of india", "ndtv", "financial times", "the economist", "pbs",
  "usa today", "politico", "axios", "dw", "deutsche welle", "france 24", "afp", "the telegraph", "sky news", "cnbc",
  "los angeles times", "nature", "science", "scientific american", "the independent", "abc.net.au", "cbc",
];

export function isReputable(publisher: string): boolean {
  const p = publisher.toLowerCase();
  return REPUTABLE.some((r) => p === r || p.includes(r));
}

export function normPublisher(p: string): string {
  return p.toLowerCase().replace(/^www\./, "").replace(/\.(com|org|net|co\.uk|in|co)$/, "").trim();
}

export interface Analysis {
  verdict: Verdict;
  strength: Strength;
  explanation: string;
  supporting: SourceItem[];
  contradicting: SourceItem[];
  factChecks: SourceItem[];
  related: SourceItem[];
}

/** Relevance thresholds — documented on the About page. */
export const FACTCHECK_MIN_RELEVANCE = 0.5;
export const NEWS_MIN_RELEVANCE = 0.6;

/**
 * Rule-based, evidence-driven verdict. See About → Methodology for the rubric.
 * Fact-checks outrank news coverage; syndicated copies (same headline) count once;
 * absence of evidence always yields "unverified", never "false".
 */
export function analyze(claim: string, factChecksIn: SourceItem[], newsIn: SourceItem[]): Analysis {
  const factChecks = factChecksIn
    .filter((f) => f.relevance >= FACTCHECK_MIN_RELEVANCE)
    .sort((a, b) => b.relevance - a.relevance);
  const fcFalse = factChecks.filter((f) => f.ratingClass === "false");
  const fcMis = factChecks.filter((f) => f.ratingClass === "misleading");
  const fcTrue = factChecks.filter((f) => f.ratingClass === "true");

  // De-duplicate syndicated copies: identical headline keyword sets count once.
  const seenTitles = new Set<string>();
  const deduped: SourceItem[] = [];
  for (const n of [...newsIn].sort((a, b) => b.relevance - a.relevance)) {
    const key = keywords(n.title, 8).sort().join(" ");
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);
    deduped.push(n);
  }
  const contraNews = deduped.filter((n) => n.relevance >= FACTCHECK_MIN_RELEVANCE && debunkSignals(n.title, claim).length > 0);
  const supNews = deduped.filter((n) => n.relevance >= NEWS_MIN_RELEVANCE && !contraNews.includes(n));
  const related = deduped.filter((n) => !contraNews.includes(n) && !supNews.includes(n) && n.relevance >= 0.3).slice(0, 8);

  const pubs = (items: SourceItem[]) => [...new Set(items.map((i) => normPublisher(i.publisher)).filter(Boolean))];
  const supPubs = pubs(supNews);
  const conPubs = pubs(contraNews);
  const repSup = supPubs.filter(isReputable).length;

  const supporting = [...fcTrue, ...supNews].slice(0, 10);
  const contradicting = [...fcFalse, ...fcMis, ...contraNews].slice(0, 10);
  const base = { supporting, contradicting, factChecks, related };

  if (fcFalse.length && fcTrue.length) {
    return { ...base, verdict: "unverified", strength: "weak",
      explanation: `Published fact-checks disagree: ${fcFalse.length} rate a matching claim as false and ${fcTrue.length} rate it as true. Review the fact-checks below — they may concern different versions of the claim.` };
  }
  if (fcFalse.length) {
    return { ...base, verdict: "false", strength: fcFalse.length >= 2 ? "strong" : "moderate",
      explanation: `${fcFalse.length} published fact-check${fcFalse.length > 1 ? "s" : ""} closely matching this claim rate${fcFalse.length > 1 ? "" : "s"} it as false (${fcFalse.map((f) => f.publisher).join(", ")}). Check that the fact-check addresses the same claim, time and place.` };
  }
  if (fcMis.length) {
    return { ...base, verdict: "misleading", strength: fcMis.length >= 2 ? "strong" : "moderate",
      explanation: `${fcMis.length} published fact-check${fcMis.length > 1 ? "s" : ""} matching this claim found it misleading or missing important context (${fcMis.map((f) => f.publisher).join(", ")}).` };
  }
  if (fcTrue.length) {
    return { ...base, verdict: "supported", strength: fcTrue.length >= 2 ? "strong" : "moderate",
      explanation: `${fcTrue.length} published fact-check${fcTrue.length > 1 ? "s" : ""} matching this claim rate${fcTrue.length > 1 ? "" : "s"} it as accurate (${fcTrue.map((f) => f.publisher).join(", ")}).` };
  }
  if (conPubs.length >= 3) {
    return { ...base, verdict: "false", strength: "moderate",
      explanation: `No formal fact-check was found, but ${conPubs.length} independent outlets publish headlines about this topic that describe it as false, a hoax, or denied. Read those articles to confirm they refer to this exact claim.` };
  }
  if (conPubs.length >= 1 && supPubs.length >= 1) {
    return { ...base, verdict: "unverified", strength: "weak",
      explanation: `Coverage is mixed: ${supPubs.length} outlet(s) report matching information while ${conPubs.length} describe related claims as false or denied. The evidence is conflicting, so no conclusion is drawn.` };
  }
  if (supPubs.length >= 5 && repSup >= 3 && conPubs.length === 0) {
    return { ...base, verdict: "supported", strength: "strong",
      explanation: `${supPubs.length} independent outlets, including ${repSup} widely established newsrooms, report information closely matching this claim, and no contradicting fact-checks or reports were found.` };
  }
  if (supPubs.length >= 3 && repSup >= 1 && conPubs.length === 0) {
    return { ...base, verdict: "likely_true", strength: "moderate",
      explanation: `${supPubs.length} independent outlets report information matching this claim (${repSup} established newsroom${repSup > 1 ? "s" : ""}) and nothing contradicting it was found. Verification is incomplete — matching keywords do not guarantee every detail is correct.` };
  }
  if (conPubs.length) {
    return { ...base, verdict: "unverified", strength: "weak",
      explanation: `Only ${conPubs.length} outlet(s) describe related claims as false or denied, and no formal fact-check was found. That is not enough to reach a conclusion.` };
  }
  if (supPubs.length) {
    return { ...base, verdict: "unverified", strength: "weak",
      explanation: `Only ${supPubs.length} independent outlet(s) report closely matching information, and no fact-check was found. That is not enough to confirm or reject the claim.` };
  }
  return { ...base, verdict: "unverified", strength: "none",
    explanation: "No closely matching coverage or fact-checks were found. This does not mean the claim is false — it may be too new, too local, worded differently, or simply not covered." };
}
