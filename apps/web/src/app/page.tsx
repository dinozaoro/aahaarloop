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
    "Aahaarloop connects kitchens with surplus to the shelters and community kitchens that can collect it in time. Publish, match, collect — with the deadline visible at every step.",
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
      "Name the food, add servings and photos, set the use-by and pickup deadlines. Drafts save as you type.",
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

const HERO_STATS = [
  { value: "< 60 s", label: "to publish a donation" },
  { value: "0", label: "LLM decisions — matching is deterministic" },
  { value: "24/7", label: "deadline visibility for every donation" },
] as const;

/* Small animated shape that floats behind the hero — original, not a photo copy */
function FloatingLeaf({
  delay,
  style,
}: {
  delay: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className="absolute rounded-full bg-green/30 blur-[40px] animate-float"
      style={{ animationDelay: delay, ...style }}
    />
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero — single orchestrated entrance */}
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden border-b border-border bg-background min-h-[70vh] flex items-center"
      >
        {/* Ambient blobs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-1/4 -right-1/6 size-[800px] rounded-full bg-primary/25 blur-[120px] animate-float"
          style={{ animationDelay: "0s" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-20%] -left-1/6 size-[700px] rounded-full bg-accent/20 blur-[110px] animate-float"
          style={{ animationDelay: "-2s" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[30%] left-[10%] size-[500px] rounded-full bg-secondary/30 blur-[90px] animate-float"
          style={{ animationDelay: "-4s" }}
        />

        {/* Floating leaf accents */}
        <FloatingLeaf delay="0s" style={{ top: "20%", right: "15%", width: "200px", height: "200px" }} />
        <FloatingLeaf delay="-2s" style={{ bottom: "25%", left: "8%", width: "260px", height: "260px" }} />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-1.15fr lg:py-36">
          <div className="flex flex-col gap-6 lg:pr-12">
            <Badge variant="secondary" className="w-fit gap-1.5 hover-lift press-scale">
              <Sprout aria-hidden="true" className="size-3.5" />
              Bengaluru food rescue
            </Badge>
            <h1
              id="hero-title"
              className="reveal text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl"
            >
              Every surplus has a destination.
            </h1>
            <p className="reveal max-w-lg text-lg text-muted-foreground text-pretty [animation-delay:120ms]">
              Aahaarloop connects kitchens with surplus to the shelters and
              community kitchens that can collect it in time. Publish, match,
              collect — with the deadline visible at every step.
            </p>
            <div className="flex animate-fade-up flex-wrap gap-3 [animation-delay:200ms]">
              <Link
                href="/donations/new"
                className={cn(buttonVariants({ size: "lg" }), "group press-scale")}
              >
                Donate surplus
                <ArrowRight
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                />
              </Link>
              <Link
                href="/browse"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "press-scale"
                )}
              >
                Find food to rescue
              </Link>
              <Link
                href="/signin"
                className={cn(buttonVariants({ variant: "ghost", size: "lg" }), "press-scale")}
              >
                Sign in
              </Link>
            </div>
            <p className="reveal flex items-center gap-2 text-sm text-muted-foreground [animation-delay:280ms]">
              <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
              Deterministic matching. No LLM decides who eats.
            </p>
          </div>

          <div className="reveal flex flex-col gap-6 [animation-delay:340ms]">
            {/* Hero match card — glassmorphism */}
            <Card className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lifted image-outline hover-lift press-scale group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 group-hover:from-primary/10 group-hover:to-accent/10 transition-colors duration-500" />
              <CardHeader className="pt-6 gap-2 z-10 relative">
                <div className="flex items-center justify-between gap-2 z-10 relative">
                  <Badge variant="warning" className="z-10 relative animate-pulse-glow">
                    Critical urgency
                  </Badge>
                  <span className="z-10 relative text-xs text-muted-foreground">
                    Example match
                  </span>
                </div>
                <CardTitle className="text-xl z-10 relative">Vegetable biryani</CardTitle>
                <CardDescription className="z-10 relative">
                  40 servings · prepared meal · picked up from Indiranagar
                </CardDescription>
              </CardHeader>
              <CardContent className="z-10 relative">
                <dl className="divide-y divide-border text-sm">
                  {MATCH_ROWS.map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between gap-4 py-2.5 z-10 relative"
                    >
                      <dt className="text-muted-foreground">{row.label}</dt>
                      <dd className="text-right font-medium data-[tabular]">{row.value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs text-secondary-foreground z-10 relative">
                  <Clock aria-hidden="true" className="size-3.5" />
                  Match score 92 · explained component by component
                </div>
              </CardContent>
            </Card>

            {/* Hero stats */}
            <div className="grid gap-4 sm:grid-cols-3">
              {HERO_STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="reveal flex flex-col gap-1 [animation-delay:420ms]"
                >
                  <dt className="order-2 text-xs text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </dt>
                  <dd className="order-1 text-3xl font-semibold tracking-tight data-[tabular]">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The gap — problem statement */}
      <section
        aria-labelledby="gap-title"
        className="border-b border-border bg-secondary/40"
      >
        <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-1.1fr lg:py-24">
          <div className="flex flex-col gap-4 lg:pr-8">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              The gap
            </p>
            <h2 id="gap-title" className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Good food is thrown away while people nearby go hungry.
            </h2>
          </div>
          <div className="flex flex-col gap-5 text-muted-foreground">
            <p className="text-lg text-pretty leading-relaxed">
              Surplus is rarely a lack of goodwill. Kitchens cannot tell, in
              time, who can collect the food before it is unsafe, and recipient
              organisations cannot tell what is available within their storage,
              transport and kitchen capacity.
            </p>
            <p className="text-pretty leading-relaxed">
              Aahaarloop closes that gap with a shared deadline, a ranked match
              list that explains itself, and a claim both sides can follow from
              publish to handover.
            </p>
            <ul className="grid gap-4 text-sm sm:grid-cols-3">
              <li className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift press-scale">
                <span className="block font-semibold text-primary">Deadlines, not guesses</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use-by, best-before and pickup deadlines stay separate.
                </p>
              </li>
              <li className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift press-scale">
                <span className="block font-semibold text-primary">Capacity-aware</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Storage, vehicle space and servings are hard filters.
                </p>
              </li>
              <li className="rounded-xl border border-border bg-card p-4 shadow-soft hover-lift press-scale">
                <span className="block font-semibold text-primary">Explainable</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Every match shows urgency, distance, quantity and needs scores.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="flow-title" className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              How it works
            </p>
            <h2 id="flow-title" className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Three steps from surplus to a shared meal.
            </h2>
          </div>
          <ol className="mt-12 grid gap-8 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="reveal flex flex-col gap-4 [animation-delay:${index * 80}ms]">
                <Card className="flex-1 flex flex-col gap-4 p-6 shadow-soft hover-lift press-scale">
                  <CardHeader className="gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="grid size-10 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary"
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

      {/* Impact */}
      <section aria-labelledby="impact-title" className="border-b border-border bg-primary text-primary-foreground">
        <div className="mx-auto w-full max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex flex-col gap-3">
            <h2 id="impact-title" className="text-2xl font-semibold tracking-tight">
              What rescue looks like
            </h2>
            <p className="max-w-2xl text-sm text-primary-foreground/80 text-pretty">
              Demo data. These figures illustrate the dashboard and are not live
              impact measurements.
            </p>
          </div>
          <dl className="mt-10 grid gap-8 sm:grid-cols-3">
            {IMPACT.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1.5 reveal [animation-delay:100ms]">
                <dt className="order-2 text-xs text-primary-foreground/70 uppercase tracking-wider">
                  {stat.label}
                </dt>
                <dd className="order-1 text-4xl font-semibold tracking-tight data-[tabular]">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Roles */}
      <section aria-labelledby="roles-title" className="border-b border-border">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Built for every side of the handover
            </p>
            <h2 id="roles-title" className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              One workspace per role, one shared deadline.
            </h2>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {ROLES.map((role) => (
              <Card
                key={role.name}
                className="flex-1 flex flex-col justify-between p-6 shadow-soft hover-lift press-scale"
              >
                <CardHeader className="gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-secondary text-primary">
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
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline press-scale"
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

      {/* CTA */}
      <section aria-labelledby="cta-title">
        <div className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:py-24">
          <div className="flex flex-col gap-8 rounded-3xl border border-border bg-primary/10 px-8 py-16 sm:px-12 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex max-w-2xl flex-col gap-3">
              <h2 id="cta-title" className="text-3xl font-semibold tracking-tight text-balance">
                Rescue tonight&apos;s surplus instead of binning it.
              </h2>
              <p className="text-muted-foreground text-pretty leading-relaxed">
                Start with a draft, add a photo if you have one, and publish
                when the pickup details are ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/donations/new" className={cn(buttonVariants({ size: "lg" }), "press-scale")}>
                Create a donation
              </Link>
              <Link
                href="/signin"
                className={cn(buttonVariants({ variant: "outline", size: "lg" }), "press-scale")}
              >
                Sign in
              </Link>
            </div>
          </div>
          <p className="mt-8 text-xs text-muted-foreground">
            Aahaarloop helps route surplus food; it does not certify that food is
            safe to eat. Donors and recipients remain responsible for food
            safety. Diet and allergen filters are preferences, not guarantees.
          </p>
        </div>
      </section>
    </div>
  );
}
