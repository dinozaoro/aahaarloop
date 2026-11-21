"use client";

import { Logo } from "@/components/logo";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteFooter() {
  const pathname = usePathname();
  if (["/dashboard", "/browse", "/donations", "/claims", "/impact", "/notifications", "/profile"].some((path) => pathname === path || pathname.startsWith(`${path}/`)) || pathname.startsWith("/donations/new")) return null;
  return (
    <footer className="mt-20 border-t border-border bg-background">
      <div className="site-shell grid gap-8 py-9 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-xl text-sm leading-6 text-muted-foreground">
            Surplus food, matched with nearby organisations that can collect it in time.
          </p>
          <p className="max-w-xl text-xs leading-5 text-muted-foreground">
            AahaarLoop does not certify food safety. Donors and recipients are responsible for handling and allergen checks.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <Link className="quiet-link" href="/browse">Find food</Link>
          <Link className="quiet-link" href="/dashboard">Donors</Link>
          <Link className="quiet-link" href="/recipient">Organisations</Link>
          <Link className="quiet-link" href="/signin">Sign in</Link>
        </nav>
      </div>
      <div className="border-t border-border">
        <p className="site-shell py-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} AahaarLoop · Product preview
        </p>
      </div>
    </footer>
  );
}
