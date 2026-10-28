import { Link } from "@tanstack/react-router";
import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

const items = [
  { to: "/", label: "Home" },
  { to: "/verify", label: "Verify News" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/history", label: "History" },
  { to: "/about", label: "About" },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 font-display text-lg font-semibold" aria-label="NewsVerify home">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-primary-foreground shadow-card">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </span>
      <span>News<span className="text-gold">Verify</span></span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4" aria-label="Main">
        <Logo />
        <ul className="hidden items-center gap-1 md:flex">
          {items.map((i) => (
            <li key={i.to}>
              <Link
                to={i.to}
                activeOptions={{ exact: i.to === "/" }}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground bg-accent" }}
              >
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link to="/verify" className="btn-glow hidden rounded-xl px-4 py-2 text-sm font-semibold sm:inline-flex">
            Start Verification
          </Link>
          <button
            className="rounded-lg p-2 text-foreground md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>
      {open && (
        <ul className="border-t border-border/60 px-4 py-3 md:hidden">
          {items.map((i) => (
            <li key={i.to}>
              <Link to={i.to} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-muted-foreground hover:text-foreground" activeOptions={{ exact: i.to === "/" }} activeProps={{ className: "text-foreground bg-accent" }}>
                {i.label}
              </Link>
            </li>
          ))}
          <li className="pt-2">
            <Link to="/verify" onClick={() => setOpen(false)} className="btn-glow block rounded-xl px-4 py-2.5 text-center font-semibold">Start Verification</Link>
          </li>
        </ul>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="text-sm text-muted-foreground">Question the News. Discover the Truth.</p>
          <p className="text-xs text-muted-foreground">A college misinformation-detection project.</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gold">Explore</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {items.map((i) => (
              <li key={i.to}><Link to={i.to} className="hover:text-foreground">{i.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gold">Limitations</h2>
          <p className="text-sm text-muted-foreground">
            NewsVerify is an assistance tool, not a guarantee of truth. Results depend on what public news and fact-check sources contain. A missing result never proves a claim false. Always open the original sources.
          </p>
        </div>
      </div>
    </footer>
  );
}
