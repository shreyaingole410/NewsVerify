import { Link } from "@tanstack/react-router";
import { BookOpen, Check, CircleCheck, CircleX, Copy, ExternalLink, FileSearch, Info, MinusCircle, Newspaper, RotateCcw, Scale } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { SourceItem, VerificationResult } from "@/lib/verify/types";
import { formatDate, SourceCard } from "./SourceCard";
import { StrengthMeter, VERDICTS, VerdictBadge } from "./VerdictBadge";

function Section({ title, icon, children, empty, count }: { title: string; icon: ReactNode; children?: ReactNode; empty?: string; count?: number }) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {icon} {title} {count !== undefined && <span className="text-sm font-normal text-muted-foreground">({count})</span>}
      </h2>
      {count === 0 ? <p className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">{empty}</p> : children}
    </section>
  );
}
const Grid = ({ items }: { items: SourceItem[] }) => (
  <div className="grid gap-3 md:grid-cols-2">{items.map((i) => <SourceCard key={i.url} item={i} />)}</div>
);

export function ResultsDashboard({ r }: { r: VerificationResult }) {
  const [copied, setCopied] = useState(false);
  const v = VERDICTS[r.verdict];
  const summary = [
    `NewsVerify result: ${v.label}`,
    `Claim: ${r.claim}`,
    r.article ? `Article: ${r.article.url}` : "",
    `Evidence strength: ${r.strength}`,
    `Why: ${r.explanation}`,
    ...[...r.factChecks, ...r.supporting, ...r.contradicting].slice(0, 5).map((s) => `- ${s.publisher}: ${s.title} ${s.url}`),
    `Checked ${new Date(r.createdAt).toLocaleString()}`,
  ].filter(Boolean).join("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  }

  return (
    <div className="space-y-10">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
        <div className="bg-hero p-6 sm:p-8">
          <p className="mb-3 text-xs uppercase tracking-wider text-muted-foreground">{r.mode === "article" ? "Article analysis" : "Claim verification"} · {new Date(r.createdAt).toLocaleString()}</p>
          <VerdictBadge verdict={r.verdict} size="lg" />
          <h1 className="mt-5 text-2xl font-semibold leading-tight sm:text-3xl">“{r.article?.title ?? r.analyzedClaim}”</h1>
          {r.article && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span className="text-gold">{r.article.publisher}</span>
              {formatDate(r.article.date) && <span>Published {formatDate(r.article.date)}</span>}
              <a href={r.article.canonical ?? r.article.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1 text-primary hover:underline">
                Open article <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          )}
          <p className="mt-5 max-w-3xl text-foreground/90">{r.explanation}</p>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <StrengthMeter strength={r.strength} />
            <div className="flex flex-wrap gap-2">
              <button onClick={copy} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/50 px-4 py-2 text-sm hover:bg-accent">
                {copied ? <Check className="h-4 w-4 text-supported" /> : <Copy className="h-4 w-4" />} {copied ? "Copied" : "Copy summary"}
              </button>
              <Link to="/verify" className="btn-glow inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold">
                <RotateCcw className="h-4 w-4" /> Verify Another Claim
              </Link>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Searched for: {r.searchTerms.join(", ")}</p>
        </div>
      </div>

      {r.article && r.article.claims.length > 0 && (
        <Section title="Key claims found in the article" icon={<FileSearch className="h-5 w-5 text-gold" />}>
          <ul className="space-y-2">
            {r.article.claims.map((c) => (
              <li key={c} className="flex flex-col gap-2 rounded-2xl border border-border bg-card/60 p-4 sm:flex-row sm:items-center">
                <p className="flex-1 text-sm">{c}</p>
                <Link to="/verify" search={{ q: c }} className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs hover:border-primary hover:text-primary">Verify this claim</Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Published fact-checks" icon={<Scale className="h-5 w-5 text-gold" />} count={r.factChecks.length} empty="No closely matching fact-checks were found in the searched sources.">
        <Grid items={r.factChecks} />
      </Section>

      <div className="grid gap-10 lg:grid-cols-2">
        <Section title="Evidence supporting the claim" icon={<CircleCheck className="h-5 w-5 text-supported" />} count={r.supporting.length} empty="No supporting evidence was found.">
          <div className="space-y-3">{r.supporting.map((i) => <SourceCard key={i.url} item={i} />)}</div>
        </Section>
        <Section title="Evidence contradicting the claim" icon={<CircleX className="h-5 w-5 text-false" />} count={r.contradicting.length} empty="No contradicting evidence was found.">
          <div className="space-y-3">{r.contradicting.map((i) => <SourceCard key={i.url} item={i} />)}</div>
        </Section>
      </div>

      {r.related.length > 0 && (
        <Section title="Related coverage (partial match)" icon={<Newspaper className="h-5 w-5 text-primary" />}>
          <Grid items={r.related} />
        </Section>
      )}
      {r.background.length > 0 && (
        <Section title="Background context (Wikipedia)" icon={<BookOpen className="h-5 w-5 text-primary" />}>
          <p className="text-sm text-muted-foreground">Used for context only — never as proof.</p>
          <Grid items={r.background} />
        </Section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card/50 p-5">
          <h2 className="mb-3 font-semibold">Sources searched</h2>
          <ul className="space-y-2 text-sm">
            {r.sources.map((s) => (
              <li key={s.name} className="flex items-start gap-2">
                {s.status === "ok" ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-supported" /> : s.status === "failed" ? <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-false" /> : <MinusCircle className="mt-0.5 h-4 w-4 shrink-0 text-unverified" />}
                <span>
                  {s.name} — <span className="text-muted-foreground">{s.status === "ok" ? `${s.count} result${s.count === 1 ? "" : "s"}` : s.status === "failed" ? `failed (${s.message})` : s.message}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-card/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Info className="h-4 w-4 text-gold" /> Known limitations</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {r.limitations.map((l) => <li key={l}>{l}</li>)}
          </ul>
        </section>
      </div>
    </div>
  );
}
