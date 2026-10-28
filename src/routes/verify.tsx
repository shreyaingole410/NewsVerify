import { createFileRoute } from "@tanstack/react-router";
import { VerificationPanel } from "@/components/verify/VerificationPanel";

type Search = { mode?: "claim" | "url" | undefined; q?: string | undefined };

export const Route = createFileRoute("/verify")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    mode: s["mode"] === "url" ? "url" : undefined,
    q: typeof s["q"] === "string" ? s["q"].slice(0, 5000) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Verify News — NewsVerify" },
      { name: "description", content: "Submit a news claim or article URL and see the evidence from news coverage and fact-checkers." },
      { property: "og:title", content: "Verify a News Claim — NewsVerify" },
      { property: "og:description", content: "Check any headline or article link against real sources." },
    ],
  }),
  component: VerifyPage,
});

function VerifyPage() {
  const { mode, q } = Route.useSearch();
  return (
    <div className="bg-hero">
      <div className="mx-auto max-w-3xl px-4 py-14">
        <h1 className="text-3xl font-semibold sm:text-4xl">Verify News</h1>
        <p className="mb-8 mt-2 text-muted-foreground">Paste a claim or an article link. We'll search live sources and show you exactly what we found.</p>
        <VerificationPanel key={`${mode}-${q}`} initialMode={mode ?? "claim"} initialValue={q ?? ""} />
      </div>
    </div>
  );
}
