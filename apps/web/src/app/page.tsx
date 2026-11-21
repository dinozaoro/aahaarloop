import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ScrollReveal, StaggerScrollReveal } from "@/components/scroll-reveal";
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  Clock3,
  MapPin,
  PackageCheck,
  Utensils,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { resolveAndroidDownloadUrl } from "@/lib/links";

export const metadata: Metadata = {
  title: "Good food deserves another destination",
  description:
    "Connect surplus food with the people and communities who need it. Every donation can make a difference.",
  alternates: { canonical: "/" },
};

const STEPS = [
  {
    number: "01",
    icon: PackageCheck,
    title: "Share surplus",
    detail: "Restaurants and food businesses list food they cannot use before it goes to waste.",
    className: "step-preview-yellow",
    previewTitle: "New food listing",
    previewLabel: "What’s available?",
    previewFood: "Freshly made vegetable biryani",
    previewMeta: "32 portions · Vegetarian",
  },
  {
    number: "02",
    icon: MapPin,
    title: "Find a destination",
    detail: "NGOs, community kitchens and volunteers discover relevant food donations.",
    className: "step-preview-pink",
    previewTitle: "A good match, close by.",
    previewLabel: "Community kitchen · Indiranagar, Bengaluru · 1.2 km",
    previewFood: "A match for 32 warm meals",
    previewMeta: "Nearby donation match",
  },
  {
    number: "03",
    icon: Utensils,
    title: "Deliver impact",
    detail: "Food is collected, delivered and tracked, creating measurable impact.",
    className: "step-preview-peach",
    previewTitle: "Food delivered. Loop complete.",
    previewLabel: "Listed · Collected · Shared",
    previewFood: "32 more reasons to keep going.",
    previewMeta: "Delivery status",
  },
] as const;

const IMPACT = [
  ["2,450", "kg of food rescued", "Good food, kept in the loop."],
  ["8,167", "meals estimated", "More possibilities at the table."],
  ["38", "organizations supported", "Stronger local connections."],
  ["312", "donations completed", "Small acts, brought full circle."],
] as const;

function AndroidAction({ inverse = false }: { inverse?: boolean }) {
  const href = resolveAndroidDownloadUrl(process.env.NEXT_PUBLIC_ANDROID_APK_URL);
  const className = inverse
    ? "landing-button landing-button-dark"
    : "landing-button landing-button-primary";
  const label = "Download for Android";

  if (!href) {
    return (
      <span className={`${className} is-unavailable`} aria-disabled="true" title="Android download URL is not configured">
        {label}<ArrowDown aria-hidden="true" />
      </span>
    );
  }

  return <a className={className} href={href}>{label}<ArrowDown aria-hidden="true" /></a>;
}

export default function HomePage() {
  return (
    <div>
      <section className="site-shell grid gap-10 pb-20 pt-14 sm:pt-20 lg:grid-cols-[1.03fr_0.97fr] lg:items-center lg:gap-16 lg:pb-28 lg:pt-24">
        <ScrollReveal><div className="flex flex-col items-start gap-6 landing-reveal-content">
          <p className="eyebrow">A local route for surplus food</p>
          <h1 className="hero-title">Good food should find a table.</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            AahaarLoop connects restaurants and food businesses with nearby NGOs, shelters and community kitchens ready to collect.
          </p>
          <div className="flex w-full flex-wrap gap-3 pt-1">
            <Link href="/donations/new" className={cn(buttonVariants({ size: "lg" }), "press-scale")}>
              Offer surplus <ArrowRight aria-hidden="true" />
            </Link>
            <Link href="/browse" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "press-scale")}>
              Find food nearby
            </Link>
          </div>
          <p className="text-sm text-muted-foreground">For kitchens, community groups and the people who help them meet.</p>
        </div></ScrollReveal>

        <ScrollReveal><div className="relative overflow-hidden rounded-2xl bg-[#293d5b] p-6 text-white sm:p-9 landing-card landing-reveal-content">
          <div aria-hidden="true" className="landing-orbit absolute -right-12 -top-16 size-64 rounded-full border border-white/10" />
          <div aria-hidden="true" className="landing-orbit landing-orbit-delayed absolute -right-2 -top-6 size-44 rounded-full border border-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-5">
              <div>
                <p className="text-sm text-white/65">One shared route</p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">From kitchen to community</h2>
              </div>
              <ArrowDownRight aria-hidden="true" className="size-6 text-[#e9a16e]" />
            </div>
            <StaggerScrollReveal>
              <ol className="mt-2">
                {STEPS.map(({ icon: Icon, title, detail }, index) => (
                  <li key={title} className="landing-step grid grid-cols-[2.5rem_1fr] gap-4 border-b border-white/15 py-5 last:border-0 last:pb-1">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-white/10 text-[#f2b17c]">
                      <Icon aria-hidden="true" className="size-[18px]" />
                    </span>
                    <details open={index === 0} className="landing-details">
                      <summary className="cursor-pointer list-none font-medium marker:hidden">{title}</summary>
                      <p className="mt-1 max-w-sm text-sm leading-6 text-white/65">{detail}</p>
                    </details>
                    {index < STEPS.length - 1 ? <span aria-hidden="true" className="col-start-1 ml-[17px] h-2 border-l border-dashed border-white/25" /> : null}
                  </li>
                ))}
              </ol>
            </StaggerScrollReveal>
            <p className="mt-6 flex items-center gap-2 text-xs leading-5 text-white/55">
              <Clock3 aria-hidden="true" className="size-4 shrink-0" />
              Pickup deadlines and food handling details stay visible along the way.
            </p>
          </div>
        </div></ScrollReveal>
      </section>

      <section className="border-y border-border bg-white/70">
        <div className="site-shell grid gap-10 py-14 sm:py-16 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <ScrollReveal><div className="flex flex-col items-start gap-4 landing-reveal-content">
            <p className="eyebrow">Made for the handover</p>
            <h2 className="section-title max-w-sm">The useful details come first.</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              A good pickup depends on more than a food listing. AahaarLoop keeps the practical information together so both sides can decide in time.
            </p>
            <Link href="/design" className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-primary">
              See what the product supports <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div></ScrollReveal>
          <StaggerScrollReveal><div className="grid gap-x-10 sm:grid-cols-2">
            {[
              ["A clear time window", "Pickup deadline and use-by date are handled separately."],
              ["A suitable match", "Distance, quantity, food needs and storage requirements guide recommendations."],
              ["A safer handover", "Allergens and handling notes are shown for people to review."],
              ["A visible journey", "Claims and pickup progress can be followed through the handover."],
            ].map(([title, detail]) => (
              <div key={title} className="step-rule py-5">
                <h3 className="font-semibold tracking-tight">{title}</h3>
                <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{detail}</p>
              </div>
            ))}
          </div></StaggerScrollReveal>
        </div>
      </section>

      <section className="site-shell grid gap-6 py-14 sm:py-16 md:grid-cols-2 md:gap-10">
        <ScrollReveal><div className="rounded-xl border border-border bg-card p-6 sm:p-8 landing-interactive-card">
          <p className="eyebrow">For food businesses</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Share what your kitchen cannot use today.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Post the quantity, collection time and handling details. Nearby organisations can respond when the offer fits their needs.</p>
          <Link href="/donations/new" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">Start a donation <ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div></ScrollReveal>
        <ScrollReveal><div className="rounded-xl border border-border bg-[#eee9df] p-6 sm:p-8 landing-interactive-card">
          <p className="eyebrow">For community organisations</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">Find food that works for your kitchen.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">Browse nearby offers, check quantity and pickup requirements, then coordinate a claim with the donor.</p>
          <Link href="/browse" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary">Browse available food <ArrowRight aria-hidden="true" className="size-4" /></Link>
        </div></ScrollReveal>
      </section>

      <section className="site-shell pb-14 sm:pb-20">
        <ScrollReveal><div className="flex flex-col gap-5 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Food safety stays with the people handling the food.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">AahaarLoop helps with discovery and coordination. It does not inspect, certify or guarantee that food is safe to eat.</p>
          </div>
          <Link href="/signin" className={cn(buttonVariants({ variant: "outline" }), "shrink-0")}>Join AahaarLoop <ArrowRight aria-hidden="true" /></Link>
        </div></ScrollReveal>
      </section>
    </div>
  );
}
