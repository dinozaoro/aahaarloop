"use client";

import { Logo } from "@/components/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (["/dashboard", "/browse", "/donations", "/claims", "/impact", "/notifications", "/profile", "/settings", "/recipient", "/volunteer", "/signin", "/register", "/recover", "/onboarding", "/install"].some((path) => pathname === path || pathname.startsWith(`${path}/`)) || pathname.startsWith("/donations/new")) return null;
  const landing = pathname === "/";

  return (
    <footer className={landing ? "landing-footer" : "mt-20 border-t border-border bg-background"}>
      <div className={`site-shell grid gap-8 py-9 sm:grid-cols-[1fr_auto] sm:items-end${landing ? " landing-footer-inner" : ""}`}>
        <div className="flex flex-col gap-3">
          <Logo className={landing ? "landing-wordmark" : undefined} />
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            {landing
              ? "Good food, full circle."
              : "Surplus food, matched with nearby organisations that can collect it in time."}
          </p>
          {landing ? null : <p className="max-w-xl text-xs leading-5 text-muted-foreground">AahaarLoop does not certify food safety. Donors and recipients are responsible for handling and allergen checks.</p>}
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {landing ? <Link className="quiet-link" href="#community">About</Link> : null}
          {landing ? <Link className="quiet-link" href="#how-it-works">How it works</Link> : null}
          {landing ? <Link className="quiet-link" href="#impact">Our impact</Link> : null}
          <Link className="quiet-link" href="/browse">Find food</Link>
          {landing ? <Link className="quiet-link" href="/donations/new">Donors</Link> : null}
          {!landing ? <Link className="quiet-link" href="/dashboard">Donors</Link> : null}
          {!landing ? <Link className="quiet-link" href="/recipient">Organisations</Link> : null}
          <Link className="quiet-link" href="/signin">Sign in</Link>
          {landing ? <Link className="quiet-link" href="#download">Download</Link> : null}
        </nav>
      </div>
      <div className={landing ? "footer-meta" : "border-t border-border"}>
        <p className={`${landing ? "site-shell py-4" : "site-shell py-4 text-xs text-muted-foreground"}`}>
          {landing ? `© ${new Date().getFullYear()} AahaarLoop. Made for a more generous everyday.` : `© ${new Date().getFullYear()} AahaarLoop · Product preview`}
          {landing ? <span>Rooted in India. Open to possibility.</span> : null}
          <span>Madagascar · CODEBENDERS ACE BUILDERS Hackathon 2026 · GitHub: <a className="underline underline-offset-2" href="https://github.com/ItokianaRAKT" rel="noreferrer" target="_blank">ItokianaRAKT</a> · <a className="underline underline-offset-2" href="https://github.com/fatratra-png" rel="noreferrer" target="_blank">fatratra-png</a></span>
        </p>
      </div>
    </footer>
  );
}
