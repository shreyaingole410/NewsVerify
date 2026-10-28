import { BookOpen, Globe2, Newspaper, ScanSearch, Scale, Send, ShieldCheck, Rss } from "lucide-react";

export const STEPS = [
  { Icon: Send, title: "Submit", text: "Enter a headline, claim, or paste a news article URL." },
  { Icon: ScanSearch, title: "Search", text: "We query global news coverage and fact-checking sources in real time." },
  { Icon: Scale, title: "Compare", text: "Fact-check ratings and independent reports are weighed using documented rules." },
  { Icon: ShieldCheck, title: "Review", text: "Read the verdict, the evidence strength, and open every original source." },
];

export function StepFlow() {
  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {STEPS.map((s, i) => (
        <li key={s.title} className="relative rounded-2xl border border-border bg-card/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand text-primary-foreground"><s.Icon className="h-5 w-5" aria-hidden /></span>
            <span className="font-display text-3xl font-semibold text-gold/40">0{i + 1}</span>
          </div>
          <h3 className="font-semibold">{s.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

export const SOURCE_TYPES = [
  { Icon: Scale, name: "Fact-check organizations", text: "Reuters Fact Check, AFP, PolitiFact, Snopes, FactCheck.org, Full Fact and more — plus the Google Fact Check Tools API when configured." },
  { Icon: Rss, name: "Google News & Bing News", text: "Current headlines and publishers covering the claim." },
  { Icon: Globe2, name: "GDELT global news", text: "Worldwide news monitoring with source URLs and dates." },
  { Icon: BookOpen, name: "Wikipedia", text: "Background on people, places and topics — context only, never proof." },
];

export function SourceTypes() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SOURCE_TYPES.map((s) => (
        <div key={s.name} className="flex gap-4 rounded-2xl border border-border bg-card/60 p-5">
          <s.Icon className="mt-0.5 h-6 w-6 shrink-0 text-primary" aria-hidden />
          <div>
            <h3 className="font-semibold">{s.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export const NewsIcon = Newspaper;
