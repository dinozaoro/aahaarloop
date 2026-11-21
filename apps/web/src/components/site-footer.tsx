import Link from "next/link";

import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-secondary/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="flex flex-col gap-3">
          <Logo />
          <p className="max-w-sm text-sm text-muted-foreground">
            Aahaarloop routes surplus food to the organisations that can rescue
            it before the deadline.
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            Aahaarloop does not certify that food is safe to eat. Donors and
            recipients remain responsible for food safety.
          </p>
        </div>

        <nav aria-label="Product" className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">Product</p>
          <Link className="text-muted-foreground hover:text-foreground" href="/dashboard">
            Donor dashboard
          </Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/browse">
            Browse donations
          </Link>
          <Link className="text-muted-foreground hover:text-foreground" href="/recipient">
            Recipient workspace
          </Link>
        </nav>

        <nav aria-label="Resources" className="flex flex-col gap-2 text-sm">
          <p className="font-semibold">Resources</p>
          <Link className="text-muted-foreground hover:text-foreground" href="/design">
            Design system
          </Link>
          <a
            className="text-muted-foreground hover:text-foreground"
            href="https://github.com/dinozaoro/aahaarloop/blob/main/docs/product-spec.md"
          >
            Product specification
          </a>
        </nav>
      </div>
      <div className="border-t border-border/70">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Aahaarloop. Prototype — impact figures
          shown in the app are demo data.
        </p>
      </div>
    </footer>
  );
}
