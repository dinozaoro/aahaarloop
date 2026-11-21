import type { Metadata, Viewport } from "next";

import "./globals.css";
import "./landing.css";
import "./workspace.css";
import "./account.css";
import "./readable-text.css";

import { InstallPrompt } from "@/components/install-prompt";
import { PageChrome } from "@/components/page-chrome";
import { ServiceWorkerStatus } from "@/components/service-worker-status";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Toaster } from "@/components/ui/sonner";
import { dmSans, instrumentSerif } from "@/lib/fonts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: {
    default: "AahaarLoop — Good food deserves another destination",
    template: "%s · AahaarLoop",
  },
  description: "Connect surplus food with the people and communities who need it.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "AahaarLoop",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "AahaarLoop — Good food deserves another destination",
    description: "Connect surplus food with the people and communities who need it.",
    type: "website",
    locale: "en_IN",
  },
};

export const viewport: Viewport = {
  themeColor: "#FFF7F0",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={cn("min-h-dvh bg-background text-foreground antialiased", dmSans.variable, instrumentSerif.variable)}>
        <PageChrome>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter />
        </PageChrome>
        <Toaster />
        <InstallPrompt />
        <ServiceWorkerStatus />
      </body>
    </html>
  );
}
