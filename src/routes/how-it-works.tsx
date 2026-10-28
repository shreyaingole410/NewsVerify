import { createFileRoute, Link } from "@tanstack/react-router";
import { SourceTypes, StepFlow } from "@/components/site/InfoSections";
import { VERDICTS, VerdictBadge } from "@/components/verify/VerdictBadge";
import type { Verdict } from "@/lib/verify/types";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — NewsVerify" },
      { name: "description", content: "How NewsVerify searches news coverage and fact-checks, compares evidence and reaches a cautious verdict." },
      { property: "og:title", content: "How NewsVerify Works" },
      { property: "og:description", content: "Submit, search, compare, review — the four-step verification process." },
    ],
  }),
  component: HowPage,
});

function HowPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-14">
      <header className="max-w-2xl">
        <h1 className="text-3xl font-semibold sm:text-4xl">How It Works</h1>
        <p className="mt-3 text-muted-foreground">Every check runs live against public sources. Nothing is pre-written and every result links back to the original articles.</p>
      </header>
      <StepFlow />
      <section>
        <h2 className="mb-6 text-2xl font-semibold">What the verdicts mean</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {(Object.keys(VERDICTS) as Verdict[]).map((v) => (
            <div key={v} className="rounded-2xl border border-border bg-card/60 p-5">
              <VerdictBadge verdict={v} size="sm" />
              <p className="mt-3 text-sm text-muted-foreground">{VERDICTS[v].desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-6 text-2xl font-semibold">Sources we search</h2>
        <SourceTypes />
      </section>
      <Link to="/verify" className="btn-glow inline-flex rounded-xl px-6 py-3 font-semibold">Try it now</Link>
    </div>
  );
}
