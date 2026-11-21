import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  HeartHandshake,
  MapPin,
  PackageCheck,
  ShieldCheck,
  Sprout,
  Store,
  UtensilsCrossed,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Every surplus has a destination",
  description:
    "Aahaarloop matches surplus food from Bengaluru kitchens with the shelters, NGOs and community kitchens that can collect it before the deadline.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Aahaarloop — Every surplus has a destination",
    description:
      "Publish surplus in under a minute, get matched by urgency, distance and fit, and collect before the deadline.",
    type: "website",
    locale: "en_IN",
    url: "/",
  },
};

const STEPS = [
  {
    title: "Publish in under a minute",
    description:
      "Name the food, add servings and photos, then set the use-by and pickup deadlines. Drafts save as you type.",
    icon: Store,
  },
  {
    title: "Match on what is safe and reachable",
    description:
      "Urgency, distance, storage, quantity and needs are scored together, so every match explains why it ranked.",
    icon: MapPin,
  },
  {
    title: "Collect before the deadline",
    description:
      "A volunteer picks up, both sides track the claim, and the handover is recorded with a reason for every change.",
    icon: PackageCheck,
  },
] as const;

const ROLES = [
  {
    name: "Donors",
    icon: Store,
    description:
      "Restaurants, hotels, bakeries and canteens turn surplus into a tracked pickup instead of waste.",
    points: [
      "One-click donation drafts with autosave",
      "Expiring-soon alerts on your dashboard",
      "Claims and pickup status per donation",
    ],
    href: "/dashboard",
    cta: "Open the donor dashboard",
  },
  {
    name: "Recipient organisations",
    icon: HeartHandshake,
    description:
      "Shelters, NGOs and community kitchens see what they can rescue now, within their capacity.",
    points: [
      "Ranked matches with urgency and distance",
      "Storage, transport and dietary constraints",
      "Active needs that steer fair allocation",
    ],
    href: "/recipient",
    cta: "Open the recipient dashboard",
  },
  {
    name: "Volunteers",
    icon: Users,
    description:
      "Clear pickup tasks with addresses, windows and quantities, from acceptance to proof of delivery.",
    points: [
      "Mission list with pickup windows",
      "Delivery timeline and proof of delivery",
      "No live location tracking required",
    ],
    href: "/browse",
    cta: "See what is available",
  },
] as const;

const IMPACT = [
  { value: "12,480", label: "meals redirected (demo)" },
  { value: "38", label: "partner kitchens (demo)" },
  { value: "63%", label: "collected before deadline (demo)" },
] as const;

const MATCH_ROWS = [
  { label: "Urgency", value: "Critical · 1 h 42 m left" },
  { label: "Distance", value: "2.4 km · 6 min by bike" },
  { label: "Quantity fit", value: "40 of 50 servings" },
  { label: "Needs match", value: "Produce · prepared meals" },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden border-b border-border"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-24 size-80 rounded-full bg-accent/50 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 -left-24 size-64 rounded-full bg-primary/10 blur-3xl"
        />
        <div className="relative mx-auto grid w-full max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-24">
          <div className="flex flex-col gap-6">
            <Badge variant="secondary" className="w-fit gap-1.5">
              <Sprout aria-hidden="true" className="size-3.5" />
              Bengaluru food rescue
            </Badge>
            <h1
              id="hero-title"
              className="animate-fade-up text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl"
            >
              Every surplus has a destination.
            </h1>
            <p className="max-w-xl animate-fade-up text-lg text-muted-foreground text-pretty [animation-delay:80ms]">
              Aahaarloop connects kitchens with surplus to the shelters and
              community kitchens that can collect it in time. Publish, match,
              collect — with the deadline visible at every step.
            </p>
            <div className="flex animate-fade-up flex-wrap gap-3 [animation-delay:160ms]">
              <Link
                href="/donations/new"
                className={cn(buttonVariants({ size: "lg" }), "group")}
              >
                Donate surplus
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
                />
              </Link>
              <Link
                href="/browse"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Find food to rescue
              </Link>
              <Link
                href="/signin"
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }))}
              >
                Sign in
              </Link>
            </div>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
              Deterministic matching. No LLM decides who eats.
            </p>
          </div>

          <Card className="animate-fade-up gap-5 [animation-delay:200ms]">
            <CardHeader className="gap-2">
              <div className="flex items-center justify-between gap-2">
                <Badge variant="warning">Critical urgency</Badge>
                <span className="text-xs text-muted-foreground">
                  Example match
                </span>
              </div>
              <CardTitle className="text-xl">Vegetable biryani</CardTitle>
              <CardDescription>
                40 servings · prepared meal · picked up from Indiranagar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="divide-y divide-border text-sm">
                {MATCH_ROWS.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 py-2.5"
                  >
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="text-right font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                <Clock aria-hidden="true" className="size-3.5" />
                Match score 92 · deterministic, explained component by component
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        aria-labelledby="problem-title"
        className="border-b border-border bg-secondary/30"
      >
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-20">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              The gap
            </p>
            <h2
              id="problem-title"
              className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Good food is thrown away while people nearby go hungry.
            </h2>
          </div>
          <div className="flex flex-col gap-4 text-muted-foreground">
            <p className="text-lg text-pretty">
              Surplus is rarely a lack of goodwill. Kitchens cannot tell, in
              time, who can collect the food before it is unsafe, and recipient
              organisations cannot tell what is available within their storage,
              transport and kitchen capacity.
            </p>
            <p className="text-pretty">
              Aahaarloop closes that gap with a shared deadline, a ranked match
              list that explains itself, and a claim that both sides can follow
              from publish to handover.
            </p>
            <ul className="grid gap-3 text-sm text-foreground sm:grid-cols-3">
              <li className="rounded-lg border border-border bg-card p-3">
                <span className="block font-semibold">Deadlines, not guesses</span>
                Use-by, best-before and pickup deadlines stay separate.
              </li>
              <li className="rounded-lg border border-border bg-card p-3">
                <span className="block font-semibold">Capacity-aware</span>
                Storage, vehicle space and servings are hard filters.
              </li>
              <li className="rounded-lg border border-border bg-card p-3">
                <span className="block font-semibold">Explainable</span>
                Every match shows urgency, distance, quantity and needs scores.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="flow-title" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              How it works
            </p>
            <h2
              id="flow-title"
              className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              Three steps from surplus to a shared meal.
            </h2>
          </div>
          <ol className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex">
                <Card className="w-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="grid size-9 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary"
                      >
                        {index + 1}
                      </span>
                      <step.icon
                        aria-hidden="true"
                        className="size-5 text-primary"
                      />
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        aria-labelledby="impact-title"
        className="border-b border-border bg-primary text-primary-foreground"
      >
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6">
          <div className="flex flex-col gap-2">
            <h2 id="impact-title" className="text-2xl font-semibold tracking-tight">
              What rescue looks like
            </h2>
            <p className="max-w-2xl text-sm text-primary-foreground/80">
              Demo data. These figures illustrate the dashboard and are not live
              impact measurements.
            </p>
          </div>
          <dl className="mt-8 grid gap-6 sm:grid-cols-3">
            {IMPACT.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1">
                <dt className="order-2 text-sm text-primary-foreground/80">
                  {stat.label}
                </dt>
                <dd className="order-1 text-4xl font-semibold tracking-tight">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="roles-title" className="border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Built for every side of the handover
            </p>
            <h2
              id="roles-title"
              className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            >
              One workspace per role, one shared deadline.
            </h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {ROLES.map((role) => (
              <Card key={role.name} className="justify-between">
                <CardHeader>
                  <span className="grid size-10 place-items-center rounded-lg bg-secondary text-primary">
                    <role.icon aria-hidden="true" className="size-5" />
                  </span>
                  <CardTitle>{role.name}</CardTitle>
                  <CardDescription>{role.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="flex flex-col gap-2 text-sm">
                    {role.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <UtensilsCrossed
                          aria-hidden="true"
                          className="mt-0.5 size-4 shrink-0 text-primary"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={role.href}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {role.cta}
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="cta-title">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="flex flex-col gap-6 rounded-2xl border border-border bg-secondary/50 px-6 py-12 sm:px-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-2xl flex-col gap-2">
              <h2
                id="cta-title"
                className="text-3xl font-semibold tracking-tight text-balance"
              >
                Rescue tonight&apos;s surplus instead of binning it.
              </h2>
              <p className="text-muted-foreground text-pretty">
                Start with a draft, add a photo if you have one, and publish
                when the pickup details are ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/donations/new" className={cn(buttonVariants({ size: "lg" }))}>
                Create a donation
              </Link>
              <Link
                href="/signin"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                Sign in
              </Link>
            </div>
          </div>
          <p className="mt-6 text-xs text-muted-foreground">
            Aahaarloop helps route surplus food; it does not certify that food is
            safe to eat. Donors and recipients remain responsible for food
            safety. Diet and allergen filters are preferences, not guarantees.
          </p>
        </div>
      </section>
    </div>
  );
}
