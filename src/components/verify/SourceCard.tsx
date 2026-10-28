import { ExternalLink } from "lucide-react";
import type { SourceItem } from "@/lib/verify/types";

export function formatDate(d?: string) {
  if (!d) return undefined;
  const t = new Date(d);
  return isNaN(t.getTime()) ? undefined : t.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const ratingCls = { false: "text-false border-false/40", misleading: "text-misleading border-misleading/40", true: "text-supported border-supported/40", unknown: "text-unverified border-unverified/40" };

export function SourceCard({ item }: { item: SourceItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="group block rounded-2xl border border-border bg-card/70 p-4 transition-all hover:-translate-y-0.5 hover:border-primary/60"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="font-medium text-gold">{item.publisher}</span>
        {formatDate(item.date) && <span>· {formatDate(item.date)}</span>}
        {item.rating && (
          <span className={`rounded-full border px-2 py-0.5 font-semibold ${ratingCls[item.ratingClass ?? "unknown"]}`}>Rating: {item.rating}</span>
        )}
      </div>
      <p className="font-medium leading-snug text-foreground group-hover:text-primary">{item.title}</p>
      {item.snippet && <p className="mt-1.5 line-clamp-3 text-sm text-muted-foreground">{item.snippet}</p>}
      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <span>Keyword match {Math.round(item.relevance * 100)}%</span>
        <span className="inline-flex items-center gap-1 group-hover:text-primary">Open source <ExternalLink className="h-3 w-3" aria-hidden /></span>
      </div>
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}
