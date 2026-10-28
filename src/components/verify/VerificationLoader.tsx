import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

const CLAIM_STEPS = ["Searching news sources", "Checking available fact-checks", "Reading background context", "Comparing evidence"];
const URL_STEPS = ["Fetching the article securely", "Extracting headline and claims", "Searching news sources", "Checking available fact-checks", "Comparing evidence"];

export function VerificationLoader({ mode }: { mode: "claim" | "url" }) {
  const steps = mode === "url" ? URL_STEPS : CLAIM_STEPS;
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => Math.min(x + 1, steps.length - 1)), 2200);
    return () => clearInterval(t);
  }, [steps.length]);
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-6 py-10 text-center">
      <div className="relative grid h-20 w-20 place-items-center">
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ring" />
        <span className="absolute inset-0 rounded-full bg-secondary/20 animate-ring [animation-delay:0.9s]" />
        <span className="relative grid h-16 w-16 place-items-center rounded-full bg-brand text-primary-foreground">
          <ShieldCheck className="h-8 w-8" aria-hidden />
        </span>
      </div>
      <div className="w-full max-w-sm space-y-2">
        {steps.map((s, idx) => (
          <div key={s} className={`flex items-center gap-3 text-sm transition-opacity ${idx <= i ? "opacity-100" : "opacity-35"}`}>
            <span className={`h-2 w-2 rounded-full ${idx < i ? "bg-secondary" : idx === i ? "bg-gold" : "bg-border"}`} />
            <span className={idx === i ? "text-foreground" : "text-muted-foreground"}>{s}{idx === i ? "…" : ""}</span>
          </div>
        ))}
      </div>
      <div className="relative h-1 w-full max-w-sm overflow-hidden rounded-full bg-border/50">
        <span className="absolute inset-y-0 w-1/3 rounded-full bg-brand animate-scan" />
      </div>
      <span className="sr-only">{steps[i]}</span>
    </div>
  );
}
