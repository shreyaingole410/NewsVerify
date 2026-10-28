import { CheckCircle2, CircleHelp, ShieldCheck, TriangleAlert, XCircle } from "lucide-react";
import type { Strength, Verdict } from "@/lib/verify/types";

export const VERDICTS: Record<Verdict, { label: string; desc: string; cls: string; Icon: typeof CheckCircle2 }> = {
  supported: { label: "Supported by Evidence", desc: "Credible evidence strongly supports the claim.", cls: "text-supported border-supported/50 bg-supported/12", Icon: ShieldCheck },
  likely_true: { label: "Likely True", desc: "Evidence supports the claim, but verification is incomplete.", cls: "text-supported border-supported/40 bg-supported/8", Icon: CheckCircle2 },
  false: { label: "False / Debunked", desc: "Reliable evidence or a credible fact-check contradicts the claim.", cls: "text-false border-false/50 bg-false/12", Icon: XCircle },
  misleading: { label: "Misleading / Missing Context", desc: "The claim omits context or misrepresents information.", cls: "text-misleading border-misleading/50 bg-misleading/12", Icon: TriangleAlert },
  unverified: { label: "Unverified / Insufficient Evidence", desc: "Not enough reliable evidence to reach a conclusion.", cls: "text-unverified border-unverified/50 bg-unverified/12", Icon: CircleHelp },
};

export function VerdictBadge({ verdict, size = "md" }: { verdict: Verdict; size?: "sm" | "md" | "lg" }) {
  const v = VERDICTS[verdict];
  const s = size === "lg" ? "px-4 py-2 text-base" : size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border font-semibold ${v.cls} ${s}`}>
      <v.Icon className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} aria-hidden /> {v.label}
    </span>
  );
}

const LEVEL: Record<Strength, number> = { none: 0, weak: 1, moderate: 2, strong: 3 };

export function StrengthMeter({ strength }: { strength: Strength }) {
  const n = LEVEL[strength];
  return (
    <div className="flex items-center gap-3" aria-label={`Evidence strength: ${strength}`}>
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`h-2 w-8 rounded-full ${i <= n ? "bg-brand" : "bg-border"}`} />
        ))}
      </div>
      <span className="text-sm capitalize text-muted-foreground">{strength === "none" ? "No evidence found" : `${strength} evidence`}</span>
    </div>
  );
}
