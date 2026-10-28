import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { SourceTypes, StepFlow } from "@/components/site/InfoSections";
import { VerificationPanel } from "@/components/verify/VerificationPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NewsVerify — AI-Powered Fake News Detection" },
      { name: "description", content: "Not every headline tells the truth. Check claims and article URLs against real news coverage and published fact-checks." },
      { property: "og:title", content: "NewsVerify — Question the News. Discover the Truth." },
      { property: "og:description", content: "Investigate news claims, check article sources, and see what credible evidence actually says." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <section className="bg-hero">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs font-medium text-gold">
              <ShieldCheck className="h-3.5 w-3.5" /> Question the News. Discover the Truth.
            </p>
            <h1 className="text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
              Not Every Headline <span className="text-gradient">Tells the Truth.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">
              Investigate news claims, check article sources, and discover what credible evidence actually says.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
              <span><strong className="block font-display text-2xl text-foreground">5</strong>live evidence sources</span>
              <span><strong className="block font-display text-2xl text-foreground">0</strong>made-up results</span>
              <span><strong className="block font-display text-2xl text-foreground">100%</strong>linked to originals</span>
            </div>
          </div>
          <VerificationPanel />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-gold">How it works</p>
            <h2 className="mt-1 text-3xl font-semibold">From headline to evidence in four steps</h2>
          </div>
          <Link to="/how-it-works" className="text-sm text-primary hover:underline">Learn more →</Link>
        </div>
        <StepFlow />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-sm font-medium text-gold">Where we look</p>
        <h2 className="mb-8 mt-1 text-3xl font-semibold">Sources searched for every check</h2>
        <SourceTypes />
      </section>
    </>
  );
}
