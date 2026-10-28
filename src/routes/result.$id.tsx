import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ResultsDashboard } from "@/components/verify/ResultsDashboard";
import { getResult } from "@/lib/history";
import type { VerificationResult } from "@/lib/verify/types";

export const Route = createFileRoute("/result/$id")({
  head: () => ({
    meta: [
      { title: "Verification Result — NewsVerify" },
      { name: "description", content: "Evidence, fact-checks and verdict for a news claim." },
      { property: "og:title", content: "Verification Result — NewsVerify" },
      { property: "og:description", content: "See the evidence behind this news claim." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  const { id } = Route.useParams();
  const [state, setState] = useState<{ loaded: boolean; r?: VerificationResult | undefined }>({ loaded: false });
  useEffect(() => setState({ loaded: true, r: getResult(id) }), [id]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {!state.loaded ? (
        <p role="status" className="text-muted-foreground">Loading result…</p>
      ) : state.r ? (
        <ResultsDashboard r={state.r} />
      ) : (
        <div className="rounded-3xl border border-border bg-surface p-10 text-center">
          <h1 className="text-2xl font-semibold">Result not found</h1>
          <p className="mt-2 text-muted-foreground">Results are saved in this browser only. It may have been deleted or checked on another device.</p>
          <Link to="/verify" className="btn-glow mt-6 inline-flex rounded-xl px-5 py-2.5 font-semibold">Start a new verification</Link>
        </div>
      )}
    </div>
  );
}
