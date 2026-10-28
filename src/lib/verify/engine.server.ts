import { getRequestHeader } from "@tanstack/react-start/server";
import {
  analyze, inferHeadlineRating, keywords, mainClaim, normalizeRating, relevance,
} from "./analysis";
import { isIPv4, isIPv6, isPrivateIPv4, isPrivateIPv6, validateArticleUrl } from "./ssrf";
import type { ArticleInfo, SourceItem, SourceStatus, VerifyResponse } from "./types";

// Browser-like UA: several news feeds throttle or block unknown bot user agents.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 NewsVerify/1.0";

async function fetchT(url: string, init: RequestInit = {}, ms = 9000): Promise<Response> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: c.signal, headers: { "User-Agent": UA, ...(init.headers as Record<string, string> | undefined) } });
  } finally {
    clearTimeout(t);
  }
}

// ---------- rate limiting (per worker isolate, best effort) ----------
const hits = new Map<string, number[]>();
function rateLimited(limit = 12): boolean {
  let ip = "unknown";
  try {
    ip = getRequestHeader("cf-connecting-ip") ?? getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  } catch { /* no request context */ }
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > limit;
}

// ---------- helpers ----------
export function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&");
}
const stripTags = (s: string) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"))?.[1];
const toIso = (d?: string) => {
  if (!d) return undefined;
  const t = new Date(d);
  return isNaN(t.getTime()) ? undefined : t.toISOString();
};

// ---------- sources ----------
async function searchWikipedia(kw: string[]): Promise<SourceItem[]> {
  const q = encodeURIComponent(kw.slice(0, 6).join(" "));
  const res = await fetchT(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${q}&srlimit=4&format=json&utf8=1`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as { query?: { search?: { title: string; snippet: string; timestamp: string }[] } };
  return (json.query?.search ?? []).map((r) => ({
    kind: "wikipedia" as const,
    title: r.title,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title.replace(/ /g, "_"))}`,
    publisher: "Wikipedia",
    date: toIso(r.timestamp),
    snippet: stripTags(r.snippet),
    relevance: relevance(kw, `${r.title} ${stripTags(r.snippet)}`),
  }));
}

function parseRss(xml: string): { title: string; link: string; date?: string | undefined; publisher: string; snippet?: string | undefined }[] {
  return xml.split(/<item>/i).slice(1).map((item) => {
    const publisher = stripTags(tag(item, "source") ?? tag(item, "News:Source") ?? "");
    let title = stripTags(tag(item, "title") ?? "");
    if (publisher && title.endsWith(` - ${publisher}`)) title = title.slice(0, -(publisher.length + 3));
    let link = decode((tag(item, "link") ?? "").trim());
    if (/bing\.com\/news\/apiclick/i.test(link)) {
      try { link = new URL(link).searchParams.get("url") ?? link; } catch { /* keep original */ }
    }
    return { title, link, date: toIso(tag(item, "pubDate")), publisher: publisher || "Unknown publisher" };
  }).filter((i) => i.title && /^https?:\/\//.test(i.link));
}

async function googleNews(query: string): Promise<ReturnType<typeof parseRss>> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchT(url, {}, 7000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parseRss(await res.text());
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr;
}

async function bingNews(query: string): Promise<ReturnType<typeof parseRss>> {
  const res = await fetchT(`https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss&setlang=en-US&mkt=en-US&cc=US`, {}, 8000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parseRss(await res.text());
}

/** Google News first; Bing News when Google is blocked or slow from the server's network. */
async function newsFeed(query: string): Promise<ReturnType<typeof parseRss>> {
  try {
    return await googleNews(query);
  } catch {
    return await bingNews(query);
  }
}

const toNews = (kw: string[]) => (i: ReturnType<typeof parseRss>[number]): SourceItem => ({ kind: "news", title: i.title, url: i.link, publisher: i.publisher, date: i.date, relevance: relevance(kw, i.title) });

async function searchGoogleNews(kw: string[]): Promise<SourceItem[]> {
  const items = await googleNews(kw.join(" "));
  return items.slice(0, 25).map(toNews(kw));
}

async function searchBingNews(kw: string[]): Promise<SourceItem[]> {
  const items = await bingNews(kw.join(" "));
  return items.slice(0, 20).map(toNews(kw));
}

async function searchGdelt(kw: string[]): Promise<SourceItem[]> {
  const words = kw.filter((w) => w.length > 3 || /^\d+$/.test(w)).slice(0, 5);
  if (words.length < 2) return [];
  const q = encodeURIComponent(`${words.join(" ")} sourcelang:english`);
  const res = await fetchT(`https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&mode=artlist&format=json&maxrecords=25&sort=hybridrel&timespan=1y`, {}, 10000);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  let json: { articles?: { url: string; title: string; seendate?: string; domain?: string }[] };
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 120) || "Unexpected response");
  }
  return (json.articles ?? []).map((a) => {
    const s = a.seendate ?? "";
    const date = s.length >= 15 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:00Z` : undefined;
    return { kind: "news" as const, title: decode(a.title), url: a.url, publisher: a.domain ?? new URL(a.url).hostname, date, relevance: relevance(kw, a.title) };
  });
}

async function searchFactCheckApi(claim: string, kw: string[]): Promise<SourceItem[] | null> {
  const key = process.env["GOOGLE_FACT_CHECK_API_KEY"];
  if (!key) return null;
  const res = await fetchT(`https://factchecktools.googleapis.com/v1alpha1/claims:search?query=${encodeURIComponent(claim.slice(0, 200))}&languageCode=en&pageSize=10&key=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as {
    claims?: { text: string; claimant?: string; claimReview?: { publisher?: { name?: string; site?: string }; url: string; title?: string; reviewDate?: string; textualRating?: string }[] }[];
  };
  const out: SourceItem[] = [];
  for (const c of json.claims ?? []) {
    for (const r of c.claimReview ?? []) {
      out.push({
        kind: "factcheck", title: r.title || c.text, url: r.url, publisher: r.publisher?.name || r.publisher?.site || "Fact-checker",
        date: toIso(r.reviewDate), snippet: `Claim reviewed: "${c.text}"${c.claimant ? ` — ${c.claimant}` : ""}`,
        rating: r.textualRating, ratingClass: normalizeRating(r.textualRating), relevance: relevance(kw, c.text),
      });
    }
  }
  return out;
}

const FC_ORGS = /(snopes|politifact|factcheck\.org|fact ?check|afp|full ?fact|boom|alt ?news|lead stories|check your fact|logically|newsmeter|vishvas)/i;

async function searchFactCheckNews(claim: string, kw: string[]): Promise<SourceItem[]> {
  const sites = ["snopes.com", "politifact.com", "factcheck.org", "factcheck.afp.com", "reuters.com", "apnews.com", "fullfact.org", "boomlive.in", "altnews.in", "leadstories.com"];
  const items = await newsFeed(`${kw.slice(0, 6).join(" ")} fact check (${sites.map((s) => `site:${s}`).join(" OR ")})`);
  return items
    .filter((i) => FC_ORGS.test(i.publisher) || /fact[- ]?check/i.test(i.title))
    .slice(0, 12)
    .map((i) => {
      const r = inferHeadlineRating(i.title, claim);
      return { kind: "factcheck" as const, title: i.title, url: i.link, publisher: i.publisher, date: i.date, rating: r.rating, ratingClass: r.ratingClass, relevance: relevance(kw, i.title) };
    });
}

const LIMITATIONS = [
  "Verdicts are produced by documented rules that compare headlines and fact-check ratings with your claim's key terms — not by reading every article in full.",
  "Matching keywords can miss sarcasm, negation, or claims that differ in a small but important detail. Open the sources to confirm.",
  "Very recent, local, or non-English stories may be under-represented in the searched sources.",
];

// ---------- claim verification ----------
export async function runClaim(input: string, opts: { skipRateLimit?: boolean } = {}): Promise<VerifyResponse> {
  if (!opts.skipRateLimit && rateLimited()) return { ok: false, code: "RATE_LIMITED", message: "Too many checks in a short time. Please wait a minute and try again." };
  const claim = mainClaim(input);
  const kw = keywords(claim, 8);
  if (kw.length < 2) return { ok: false, code: "TOO_VAGUE", message: "Please enter a more specific claim with at least a few meaningful words (who, what, where)." };

  const [wiki, gdelt, gnews, bnews, fcApi, fcNews] = await Promise.allSettled([
    searchWikipedia(kw), searchGdelt(kw), searchGoogleNews(kw), searchBingNews(kw), searchFactCheckApi(claim, kw), searchFactCheckNews(claim, kw),
  ]);
  const errMsg = (r: PromiseRejectedResult) => (r.reason instanceof Error ? (r.reason.name === "AbortError" ? "Timed out" : r.reason.message) : "Request failed");
  const status = (name: string, r: PromiseSettledResult<SourceItem[] | null>): SourceStatus =>
    r.status === "rejected" ? { name, status: "failed", count: 0, message: errMsg(r) }
      : r.value === null ? { name, status: "skipped", count: 0, message: "Not configured (optional API key missing)" }
        : { name, status: "ok", count: r.value.length };
  const sources = [
    status("Google Fact Check Tools API", fcApi),
    status("Fact-check publishers (Snopes, PolitiFact, AFP, Reuters…)", fcNews),
    status("Google News RSS", gnews),
    status("Bing News", bnews),
    status("GDELT global news", gdelt),
    status("Wikipedia", wiki),
  ];
  const val = (r: PromiseSettledResult<SourceItem[] | null>) => (r.status === "fulfilled" && r.value ? r.value : []);

  const evidenceOk = [fcApi, fcNews, gnews, bnews, gdelt].some((r) => r.status === "fulfilled" && r.value !== null);
  if (!evidenceOk) return { ok: false, code: "SOURCES_UNAVAILABLE", message: "None of the news or fact-check sources could be reached, so no verification was performed. Please try again shortly.", sources };

  const dedupe = (items: SourceItem[]) => {
    const seen = new Set<string>();
    return items.filter((i) => (seen.has(i.url) ? false : (seen.add(i.url), true)));
  };
  const news = dedupe([...val(gnews), ...val(bnews), ...val(gdelt)]);
  const factChecks = dedupe([...val(fcApi), ...val(fcNews)]);
  const a = analyze(claim, factChecks, news);

  const limitations = [...LIMITATIONS];
  if (sources.some((s) => s.status === "failed")) limitations.unshift("Some sources failed to respond (see the list below), so evidence may be incomplete.");
  if (sources[0]?.status === "skipped") limitations.push("The Google Fact Check Tools API is not configured; fact-checks were discovered through news search instead, and their ratings are inferred from headlines.");

  return {
    ok: true,
    result: {
      id: crypto.randomUUID(), mode: "claim", claim: input.trim(), analyzedClaim: claim, searchTerms: kw,
      verdict: a.verdict, strength: a.strength, explanation: a.explanation,
      supporting: a.supporting, contradicting: a.contradicting, factChecks: a.factChecks, related: a.related,
      background: val(wiki).filter((w) => w.relevance >= 0.3).slice(0, 3),
      sources, limitations, createdAt: new Date().toISOString(),
    },
  };
}

// ---------- safe article fetching ----------
async function assertPublicHost(host: string): Promise<void> {
  const h = host.replace(/^\[|\]$/g, "");
  if (isIPv4(h)) { if (isPrivateIPv4(h)) throw new Error("BLOCKED"); return; }
  if (isIPv6(h)) { if (isPrivateIPv6(h)) throw new Error("BLOCKED"); return; }
  const answers: string[] = [];
  for (const type of ["A", "AAAA"]) {
    const res = await fetchT(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(h)}&type=${type}`, { headers: { accept: "application/dns-json" } }, 5000);
    if (!res.ok) continue;
    const j = (await res.json()) as { Answer?: { type: number; data: string }[] };
    for (const a of j.Answer ?? []) if (a.type === 1 || a.type === 28) answers.push(a.data);
  }
  if (!answers.length) throw new Error("DNS");
  if (answers.some((ip) => (isIPv4(ip) ? isPrivateIPv4(ip) : isPrivateIPv6(ip)))) throw new Error("BLOCKED");
}

const MAX_BYTES = 1_500_000;

async function safeFetchHtml(start: URL): Promise<{ html: string; finalUrl: string }> {
  let url = start;
  for (let hop = 0; hop < 5; hop++) {
    const v = validateArticleUrl(url.toString());
    if (!v.ok) throw new Error("BLOCKED");
    await assertPublicHost(url.hostname);
    const res = await fetchT(url.toString(), { redirect: "manual", headers: { accept: "text/html,application/xhtml+xml;q=0.9,text/plain;q=0.5" } }, 10000);
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) throw new Error("FETCH");
      url = new URL(loc, url);
      continue;
    }
    if (res.status === 401 || res.status === 402 || res.status === 403) throw new Error("PAYWALL");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html|application\/xhtml|text\/plain/i.test(ct)) throw new Error("TYPE");
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > MAX_BYTES * 2) throw new Error("SIZE");
    const reader = res.body?.getReader();
    if (!reader) throw new Error("FETCH");
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      chunks.push(value);
      if (total >= MAX_BYTES) { await reader.cancel(); break; }
    }
    const buf = new Uint8Array(total);
    let off = 0;
    for (const c of chunks) { buf.set(c.subarray(0, Math.min(c.byteLength, total - off)), off); off += c.byteLength; if (off >= total) break; }
    return { html: new TextDecoder("utf-8", { fatal: false }).decode(buf), finalUrl: url.toString() };
  }
  throw new Error("REDIRECTS");
}

function meta(html: string, keys: string[]): string | undefined {
  for (const k of keys) {
    const re1 = new RegExp(`<meta[^>]+(?:property|name|itemprop)=["']${k}["'][^>]*content=["']([^"']*)["']`, "i");
    const re2 = new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${k}["']`, "i");
    const m = html.match(re1)?.[1] ?? html.match(re2)?.[1];
    if (m?.trim()) return decode(m.trim());
  }
  return undefined;
}

export function extractArticle(html: string, finalUrl: string): Omit<ArticleInfo, "url"> & { text: string } {
  const title = meta(html, ["og:title", "twitter:title", "headline"]) ?? (html.match(/"headline"\s*:\s*"([^"]{5,300})"/)?.[1]) ?? stripTags(tag(html, "title") ?? "");
  const publisher = meta(html, ["og:site_name", "application-name", "publisher"]) ?? new URL(finalUrl).hostname.replace(/^www\./, "");
  const date = toIso(meta(html, ["article:published_time", "datePublished", "pubdate", "date", "dc.date", "parsely-pub-date"]) ?? html.match(/"datePublished"\s*:\s*"([^"]+)"/)?.[1]);
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1];
  let body = html.replace(/<(script|style|noscript|svg|nav|footer|header|aside|form|iframe)[\s\S]*?<\/\1>/gi, " ");
  const article = body.match(/<article[\s\S]*?<\/article>/i)?.[0];
  if (article && article.length > 1500) body = article;
  const paras = [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => stripTags(m[1] ?? "")).filter((p) => p.length > 60);
  const text = paras.join("\n\n").slice(0, 20000);
  return { title: title ? decode(title) : undefined, publisher, date, canonical: canonical ? new URL(canonical, finalUrl).toString() : undefined, text, excerpt: paras.slice(0, 2).join(" ").slice(0, 400), claims: extractClaims(text) };
}

export function extractClaims(text: string): string[] {
  const sentences = text.split(/(?<=[.!?])\s+(?=[A-Z"“])/).map((s) => s.trim()).filter((s) => s.length >= 60 && s.length <= 280 && !s.endsWith("?"));
  const scored = sentences.map((s) => {
    let score = 0;
    if (/\d/.test(s)) score += 2;
    score += Math.min(3, (s.slice(1).match(/\b[A-Z][a-z]+/g) ?? []).length);
    if (/\b(said|according to|announced|reported|confirmed|found|percent|%|million|billion)\b/i.test(s)) score += 1;
    if (/^[“"]/.test(s)) score -= 2;
    return { s, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, 3).map((x) => x.s);
}

export async function runArticle(rawUrl: string): Promise<VerifyResponse> {
  if (rateLimited(8)) return { ok: false, code: "RATE_LIMITED", message: "Too many checks in a short time. Please wait a minute and try again." };
  const v = validateArticleUrl(rawUrl);
  if (!v.ok) return { ok: false, code: "INVALID_URL", message: v.message };
  let page: { html: string; finalUrl: string };
  try {
    page = await safeFetchHtml(v.url);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    const msg =
      m === "BLOCKED" ? "This link points to a private or disallowed address and cannot be fetched."
        : m === "DNS" ? "We couldn't find that website. Check the address for typos."
          : m === "PAYWALL" ? "The site refused access (paywall or login required). Please paste the article's text in the claim box instead."
            : m === "TYPE" ? "That link isn't a web page (HTML or text), so it can't be analyzed."
              : m === "AbortError" ? "The website took too long to respond. Try again, or paste the article text instead."
                : "We couldn't download this article. It may block automated access — please paste its text in the claim box instead.";
    return { ok: false, code: m === "BLOCKED" || m === "DNS" ? "INVALID_URL" : "EXTRACT_FAILED", message: msg };
  }
  const info = extractArticle(page.html, page.finalUrl);
  if (info.text.length < 300 && !info.title) {
    return { ok: false, code: "EXTRACT_FAILED", message: "We couldn't extract the article text — it may be behind a paywall or loaded by scripts. Please paste the article's text in the claim box instead." };
  }
  const subject = info.title && info.title.length > 15 ? info.title : info.claims[0] ?? info.title ?? "";
  const res = await runClaim(subject, { skipRateLimit: true });
  if (!res.ok) return res;
  const limitations = [...res.result.limitations];
  if (info.text.length < 300) limitations.unshift("Only the headline could be extracted (the body may be paywalled or script-rendered).");
  limitations.unshift("For articles, the headline is verified as the central claim. Use the key claims listed to verify individual statements.");
  return {
    ok: true,
    result: {
      ...res.result, mode: "article", claim: subject, limitations,
      article: { url: page.finalUrl, canonical: info.canonical, title: info.title, publisher: info.publisher, date: info.date, excerpt: info.excerpt, claims: info.claims },
    },
  };
}
