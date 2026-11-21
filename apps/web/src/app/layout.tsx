import type { Metadata } from "next";

import "./globals.css";

import { PageChrome } from "@/components/page-chrome";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { inter, playfairDisplay } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "Aahaarloop — Every surplus has a destination",
    template: "%s · Aahaarloop",
  },
  description:
    "Match surplus food with the organisations that can rescue it before the deadline.",
  openGraph: {
    title: "Aahaarloop — Every surplus has a destination",
    description:
      "Match surplus food with the organisations that can rescue it before the deadline.",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-dvh bg-background text-foreground antialiased",
          inter.variable,
          playfairDisplay.variable,
        )}
      >
        <PageChrome>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter />
        </PageChrome>
        <Toaster />
      </body>
    </html>
  );
}
