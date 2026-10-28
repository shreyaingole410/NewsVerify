import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, FileText, Link2, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { saveResult } from "@/lib/history";
import { validateArticleUrl } from "@/lib/verify/ssrf";
import { verifyArticleUrl, verifyClaim } from "@/lib/verify/verify.functions";
import { VerificationLoader } from "./VerificationLoader";

const EXAMPLES = [
  "NASA confirmed the Earth will experience six days of total darkness",
  "The Great Wall of China is visible from space with the naked eye",
  "India's Chandrayaan-3 landed near the Moon's south pole",
  "Drinking hot water kills the coronavirus",
];

type Mode = "claim" | "url";

export function VerificationPanel({ initialMode = "claim", initialValue = "" }: { initialMode?: Mode; initialValue?: string }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [claim, setClaim] = useState(initialMode === "claim" ? initialValue : "");
  const [url, setUrl] = useState(initialMode === "url" ? initialValue : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const navigate = useNavigate();
  const runClaim = useServerFn(verifyClaim);
  const runUrl = useServerFn(verifyArticleUrl);
  const id = useId();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (mode === "claim") {
      if (!claim.trim()) return setError({ message: "Please enter a headline, statement, or claim to verify." });
      if (claim.trim().length < 8) return setError({ message: "That claim is too short. Add more detail." });
    } else {
      if (!url.trim()) return setError({ message: "Please paste the full link to a news article." });
      const v = validateArticleUrl(url);
      if (!v.ok) return setError({ message: v.message });
    }
    setLoading(true);
    try {
      const res = mode === "claim" ? await runClaim({ data: { claim: claim.trim() } }) : await runUrl({ data: { url: url.trim() } });
      if (!res.ok) {
        setError({ message: res.message, code: res.code });
        return;
      }
      saveResult(res.result);
      navigate({ to: "/result/$id", params: { id: res.result.id } });
    } catch {
      setError({ message: "Network error — we couldn't reach the verification service. Check your connection and retry.", code: "NETWORK" });
    } finally {
      setLoading(false);
    }
  }

  const tab = (m: Mode, label: string, Icon: typeof FileText) => (
    <button
      type="button"
      role="tab"
      id={`${id}-tab-${m}`}
      aria-selected={mode === m}
      aria-controls={`${id}-panel`}
      onClick={() => { setMode(m); setError(null); }}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${mode === m ? "bg-card text-foreground shadow-card ring-1 ring-primary/40" : "text-muted-foreground hover:text-foreground"}`}
    >
      <Icon className="h-4 w-4" aria-hidden /> {label}
    </button>
  );

  return (
    <div className="rounded-3xl border border-border bg-card p-4 sm:p-6">
      {loading ? (
        <VerificationLoader mode={mode} />
      ) : (
        <>
          <div role="tablist" aria-label="Verification mode" className="mb-5 flex gap-1 rounded-2xl bg-background/60 p-1">
            {tab("claim", "Check a News Claim", FileText)}
            {tab("url", "Verify an Article URL", Link2)}
          </div>
          <form id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${mode}`} onSubmit={submit} noValidate className="space-y-4">
            {mode === "claim" ? (
              <div className="space-y-2">
                <label htmlFor={`${id}-claim`} className="text-sm font-medium">Headline, statement, or claim</label>
                <textarea
                  id={`${id}-claim`}
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder='e.g. "Scientists confirm a new species of dinosaur discovered in Argentina"'
                  aria-invalid={!!error}
                  className="w-full resize-y rounded-xl border border-input bg-background/70 px-4 py-3 text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor={`${id}-url`} className="text-sm font-medium">News article URL</label>
                <input
                  id={`${id}-url`}
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.example-news.com/2026/10/article"
                  aria-invalid={!!error}
                  className="w-full rounded-xl border border-input bg-background/70 px-4 py-3 text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {error && (
              <div role="alert" className="flex flex-col gap-3 rounded-xl border border-false/40 bg-false/10 p-3 text-sm sm:flex-row sm:items-center">
                <AlertTriangle className="h-4 w-4 shrink-0 text-false" aria-hidden />
                <p className="flex-1">{error.message}</p>
                {(error.code === "NETWORK" || error.code === "SOURCES_UNAVAILABLE") && (
                  <button type="button" onClick={() => submit()} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 hover:bg-accent">
                    <RotateCcw className="h-3.5 w-3.5" /> Retry
                  </button>
                )}
                {error.code === "EXTRACT_FAILED" && (
                  <button type="button" onClick={() => { setMode("claim"); setError(null); }} className="rounded-lg border border-border px-3 py-1.5 hover:bg-accent">
                    Paste text instead
                  </button>
                )}
              </div>
            )}

            <button type="submit" disabled={!ready} className="btn-glow inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold disabled:cursor-wait disabled:opacity-60">
              <Sparkles className="h-4 w-4" aria-hidden /> {!ready ? "Loading…" : mode === "claim" ? "Verify Claim" : "Analyze Article"}
            </button>
          </form>

          {mode === "claim" && (
            <div className="mt-5">
              <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Try an example</p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button key={ex} type="button" onClick={() => { setClaim(ex); setError(null); }} className="rounded-full border border-border bg-background/50 px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground">
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="mt-5 text-xs text-muted-foreground">
            Results depend on the availability and quality of public evidence. When evidence is thin, NewsVerify says so instead of guessing.
          </p>
        </>
      )}
    </div>
  );
}
