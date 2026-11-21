import type { Metadata, Viewport } from "next";

import "./globals.css";

import { PageChrome } from "@/components/page-chrome";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { inter } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "AahaarLoop — Good food should find a table",
    template: "%s · AahaarLoop",
  },
  description:
    "Match surplus food with the organisations that can rescue it before the deadline.",
  openGraph: {
    title: "AahaarLoop — Good food should find a table",
    description:
      "Match surplus food with the organisations that can rescue it before the deadline.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f4f0",
  viewportFit: "cover",
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
