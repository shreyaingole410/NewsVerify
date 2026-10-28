import { describe, expect, it } from "vitest";
import { analyze, keywords, relevance } from "@/lib/verify/analysis";
import { isBlockedHostname, validateArticleUrl } from "@/lib/verify/ssrf";
import type { SourceItem } from "@/lib/verify/types";

const claim = "NASA confirmed six days of total darkness on Earth";
const kw = keywords(claim);
const news = (title: string, publisher: string): SourceItem => ({ kind: "news", title, publisher, url: `https://x/${publisher}/${title}`, relevance: relevance(kw, title) });

describe("verdict rules", () => {
  it("no evidence yields unverified, never false", () => {
    expect(analyze(claim, [], []).verdict).toBe("unverified");
  });
  it("a matching false fact-check yields false", () => {
    const fc: SourceItem = { kind: "factcheck", title: "NASA six days darkness Earth", publisher: "Snopes", url: "https://s", ratingClass: "false", rating: "False", relevance: 0.9 };
    expect(analyze(claim, [fc], []).verdict).toBe("false");
  });
  it("one matching news report is not enough to confirm", () => {
    expect(analyze(claim, [], [news("NASA confirmed six days total darkness Earth", "Reuters")]).verdict).toBe("unverified");
  });
  it("syndicated copies of one headline count once", () => {
    const t = "NASA confirmed six days total darkness Earth";
    const r = analyze(claim, [], [news(t, "Reuters"), news(t, "Yahoo"), news(t, "MSN")]);
    expect(r.verdict).toBe("unverified");
  });
  it("debunk words used by the claim itself are ignored", () => {
    const c = "The moon landing was fake";
    const k = keywords(c);
    const items = ["Moon landing fake says blogger", "Was moon landing fake viral post", "Moon landing fake theory spreads"].map((t, i) => ({ kind: "news" as const, title: t, publisher: `p${i}`, url: `u${i}`, relevance: relevance(k, t) }));
    expect(analyze(c, [], items).verdict).not.toBe("false");
  });
});

describe("SSRF guards", () => {
  it.each(["http://localhost/", "http://127.0.0.1/", "http://10.0.0.5/", "http://192.168.1.1/", "http://169.254.169.254/", "http://[::1]/", "http://intranet/", "file:///etc/passwd", "http://example.com:8080/"])(
    "blocks %s",
    (u) => expect(validateArticleUrl(u).ok).toBe(false),
  );
  it("allows public news URLs", () => {
    expect(validateArticleUrl("https://www.bbc.com/news/article").ok).toBe(true);
    expect(isBlockedHostname("www.reuters.com")).toBe(false);
  });
});
