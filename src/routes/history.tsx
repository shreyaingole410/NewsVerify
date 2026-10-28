import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLink, History, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { VerdictBadge } from "@/components/verify/VerdictBadge";
import { clearResults, deleteResult, listResults } from "@/lib/history";
import type { VerificationResult } from "@/lib/verify/types";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Verification History — NewsVerify" },
      { name: "description", content: "Your previous NewsVerify checks, stored privately in this browser." },
      { property: "og:title", content: "Verification History — NewsVerify" },
      { property: "og:description", content: "Reopen, delete or clear your previous checks." },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [items, setItems] = useState<VerificationResult[] | null>(null);
  useEffect(() => setItems(listResults()), []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold sm:text-4xl">History</h1>
          <p className="mt-2 text-sm text-muted-foreground">Saved only in this browser — no account and no personal data required.</p>
        </div>
        {items && items.length > 0 && (
          <button
            onClick={() => { if (confirm("Clear all verification history?")) { clearResults(); setItems([]); } }}
            className="inline-flex items-center gap-2 rounded-xl border border-false/40 px-4 py-2 text-sm text-false hover:bg-false/10"
          >
            <Trash2 className="h-4 w-4" /> Clear history
          </button>
        )}
      </div>
      {items === null ? (
        <p role="status" className="text-muted-foreground">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <History className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No checks yet.</p>
          <Link to="/verify" className="btn-glow mt-6 inline-flex rounded-xl px-5 py-2.5 font-semibold">Start Verification</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-2xl border border-border bg-card/60 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <VerdictBadge verdict={r.verdict} size="sm" />
                <time className="text-xs text-muted-foreground" dateTime={r.createdAt}>{new Date(r.createdAt).toLocaleString()}</time>
              </div>
              <p className="mt-3 line-clamp-2 font-medium">{r.article?.title ?? r.analyzedClaim}</p>
              {r.article && <p className="mt-1 truncate text-xs text-muted-foreground">{r.article.url}</p>}
              <div className="mt-4 flex gap-2">
                <Link to="/result/$id" params={{ id: r.id }} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:border-primary hover:text-primary">
                  <ExternalLink className="h-3.5 w-3.5" /> Reopen result
                </Link>
                <button onClick={() => { deleteResult(r.id); setItems(listResults()); }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:text-false" aria-label={`Delete check: ${r.analyzedClaim}`}>
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
