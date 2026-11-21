import Link from "next/link";

import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/60 backdrop-blur-sm">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="flex flex-col gap-4">
          <Logo className="opacity-90" />
          <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
            Aahaarloop routes surplus food to the organisations that can rescue
            it before the deadline — deterministically explained, never decided
            by an LLM.
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Aahaarloop does not certify that food is safe to eat. Donors and
            recipients remain responsible for food safety.
          </p>
        </div>

        <nav aria-label="Product" className="flex flex-col gap-2 text-sm">
          <p className="font-display font-semibold text-foreground tracking-tight uppercase text-xs">
            Product
          </p>
          <Link
            className="text-muted-foreground hover:text-foreground transition-colors press-scale"
            href="/dashboard"
          >
            Donor dashboard
          </Link>
          <Link
            className="text-muted-foreground hover:text-foreground transition-colors press-scale"
            href="/browse"
          >
            Browse donations
          </Link>
          <Link
            className="text-muted-foreground hover:text-foreground transition-colors press-scale"
            href="/recipient"
          >
            Recipient workspace
          </Link>
        </nav>

        <nav aria-label="Resources" className="flex flex-col gap-2 text-sm">
          <p className="font-display font-semibold text-foreground tracking-tight uppercase text-xs">
            Resources
          </p>
          <Link
            className="text-muted-foreground hover:text-foreground transition-colors press-scale"
            href="/design"
          >
            Design system
          </Link>
          <a
            className="text-muted-foreground hover:text-foreground transition-colors press-scale"
            href="https://github.com/dinozaoro/aahaarloop/blob/main/docs/product-spec.md"
          >
            Product specification
          </a>
        </nav>
      </div>
      <div className="border-t border-border/60">
        <p className="mx-auto w-full max-w-6xl px-4 py-8 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Aahaarloop. Prototype — impact figures
          shown in the app are demo data.
        </p>
      </div>
    </footer>
  );
}
