import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About & Methodology — NewsVerify" },
      { name: "description", content: "The purpose, sources, verdict rules and limitations of NewsVerify." },
      { property: "og:title", content: "About & Methodology — NewsVerify" },
      { property: "og:description", content: "How NewsVerify compares evidence, and why it is an assistance tool, not a guarantee." },
    ],
  }),
  component: AboutPage,
});

const Block = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="rounded-2xl border border-border bg-card/50 p-6">
    <h2 className="mb-3 text-xl font-semibold">{title}</h2>
    <div className="space-y-3 text-muted-foreground [&_strong]:text-foreground">{children}</div>
  </section>
);

function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-14">
      <header className="mb-4">
        <h1 className="text-3xl font-semibold sm:text-4xl">About & Methodology</h1>
        <p className="mt-3 rounded-xl border border-gold/40 bg-gold/10 p-4 text-sm text-foreground">
          NewsVerify is an <strong>assistance tool, not an absolute guarantee of truth</strong>. Use it to find evidence quickly, then judge the original sources yourself.
        </p>
      </header>
      <Block title="Purpose">
        <p>NewsVerify is a college project that helps people check whether online claims are supported by credible evidence, false, misleading, or simply unverified — and shows every source it used.</p>
      </Block>
      <Block title="External sources">
        <ul className="list-disc space-y-1 pl-5">
          <li><strong>Google Fact Check Tools API</strong> (optional) — published ClaimReview ratings from fact-checkers worldwide.</li>
          <li><strong>Fact-check publishers via Google News</strong> — Reuters, AFP, PolitiFact, Snopes, FactCheck.org, Full Fact, BOOM, Alt News, Lead Stories.</li>
          <li><strong>Google News RSS</strong>, <strong>Bing News</strong> and <strong>GDELT DOC API</strong> — current and global news coverage.</li>
          <li><strong>Wikipedia</strong> — background context only.</li>
        </ul>
      </Block>
      <Block title="How evidence is compared">
        <p>The claim's key terms are extracted, and each result gets a <strong>keyword match</strong> score (share of key terms in its title). Then documented rules apply, in order:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Fact-checks with ≥50% match and a clear rating decide first: false → <strong>False</strong>, misleading/partly → <strong>Misleading</strong>, true → <strong>Supported</strong>. Disagreeing fact-checks → <strong>Unverified</strong>.</li>
          <li>Without fact-checks: 3+ independent outlets whose headlines call the matching story false, a hoax, or denied → <strong>False</strong>.</li>
          <li>5+ independent outlets (≥60% match), 3+ of them established newsrooms, nothing contradicting → <strong>Supported</strong>. 3+ outlets with at least one established newsroom → <strong>Likely True</strong>.</li>
          <li>Anything weaker, conflicting or empty → <strong>Unverified</strong>.</li>
        </ol>
        <p>Syndicated copies with the same headline count once. Words the claim itself uses (e.g. "fake") are ignored when detecting debunking language. Evidence strength (none / weak / moderate / strong) reflects how many independent items back the verdict — no arbitrary percentage is shown.</p>
        <p>Article URLs are fetched with SSRF protections (private networks blocked, DNS and every redirect re-checked, 10-second timeout, 1.5 MB limit, HTML/text only, scripts never executed). The headline is verified as the central claim; key sentences are listed for individual checks.</p>
      </Block>
      <Block title="Why missing results don't mean false">
        <p>A claim may be new, local, in another language, or worded differently from coverage. No matches yields <strong>Unverified</strong>, never <strong>False</strong>.</p>
      </Block>
      <Block title="Why a reputable outlet isn't automatically right">
        <p>Established newsrooms make errors and corrections, and a single article may quote others' claims. Publisher reputation is only one factor and never overrides a specific fact-check.</p>
      </Block>
      <Block title="Why automated assessments make mistakes">
        <p>Keyword matching cannot fully understand negation, sarcasm, or subtle changes in numbers, dates and places. Headline-inferred fact-check ratings are clearly marked. Always read the original sources before sharing a conclusion.</p>
      </Block>
      <Block title="Privacy">
        <p>No account is needed. History is stored only in your browser and can be deleted at any time.</p>
      </Block>
    </div>
  );
}
