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
import { AnimatedCounter } from "@/components/animated-counter";
import { ScrollReveal, StaggerScrollReveal } from "@/components/scroll-reveal";
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

const MARQUEE_ITEMS = [
  "Saffron · Bengaluru · Chennai · Delhi · Mumbai · Kolkata · Pune · Hyderabad · Ahmedabad · Jaipur · Lucknow · Kochi ·",
  "Saffron · Bengaluru · Chennai · Delhi · Mumbai · Kolkata · Pune · Hyderabad · Ahmedabad · Jaipur · Lucknow · Kochi ·",
];

function FloatingSpice({
  delay,
  width,
  height,
  top,
  left,
  color = "primary/20",
}: {
  delay: string;
  width: string;
  height: string;
  top: string;
  left: string;
  color?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "absolute rounded-full blur-[64px] animate-float blob-morph",
        color
      )}
      style={{
        animationDelay: delay,
        width,
        height,
        top,
        left,
      }}
    />
  );
}

function OrganicLeaf({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("block", className)}
      aria-hidden="true"
    >
      <path
        d="M 60 100 C 60 60 120 20 150 60 C 180 100 140 160 100 180 C 60 200 40 140 60 100 Z"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
      />
      <path
        d="M 100 180 C 60 200 40 140 60 100 C 60 60 120 20 150 60 C 180 100 140 160 100 180 Z"
        fill="currentColor"
        opacity="0.15"
      />
    </svg>
  );
}

export default function HomePage() {
  return (
    <div className="flex flex-col relative overflow-hidden">
      {/* Background mesh blobs — warm Indian tones */}
      <div
        aria-hidden="true"
        className="mesh-blob size-[900px] rounded-full bg-primary/25"
        style={{ top: "-10%", right: "-10%", animationDelay: "0s" }}
      />
      <div
        aria-hidden="true"
        className="mesh-blob size-[800px] rounded-full bg-secondary/25"
        style={{
          bottom: "-15%",
          left: "-10%",
          animationDelay: "-2.5s",
        }}
      />
      <div
        aria-hidden="true"
        className="mesh-blob size-[600px] rounded-full bg-accent/20"
        style={{ top: "30%", left: "5%", animationDelay: "-5s" }}
      />

      {/* Floating spice accents */}
      <FloatingSpice delay="0s" width="220px" height="220px" top="15%" left="12%" color="warning/25" />
      <FloatingSpice delay="-2s" width="280px" height="280px" top="80%" left="5%" color="secondary/20" />
      <FloatingSpice delay="-4s" width="180px" height="180px" top="45%" left="10%" color="primary/30" />

      <section
        aria-labelledby="hero-title"
        className="relative z-10 min-h-[85vh] flex items-center"
      >
        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 py-28 sm:px-6 lg:grid-cols-1.15fr lg:py-40">
          <div className="flex flex-col gap-6 lg:pr-14">
            <ScrollReveal once threshold={0.1}>
              <Badge variant="secondary" className="w-fit gap-2 hover-lift press-scale">
                <Sprout aria-hidden="true" className="size-3.5" />
                Bengaluru food rescue
              </Badge>
            </ScrollReveal>

            <ScrollReveal once threshold={0.12}>
              <h1
                id="hero-title"
                className="reveal scale-in font-display text-5xl font-bold tracking-tight text-balance sm:text-7xl lg:text-8xl"
                style={{ animationDelay: "60ms" }}
              >
                Every surplus<span className="text-primary"> has a destination.</span>
              </h1>
            </ScrollReveal>

            <ScrollReveal once threshold={0.12}>
              <p className="reveal max-w-lg text-lg text-muted-foreground text-pretty leading-relaxed" style={{ animationDelay: "140ms" }}>
                Aahaarloop connects kitchens with surplus to the shelters and
                community kitchens that can collect it in time. Publish, match,
                collect — with the deadline visible at every step.
              </p>
            </ScrollReveal>

            <ScrollReveal once threshold={0.12}>
              <div className="flex flex-wrap gap-3" style={{ animationDelay: "220ms" }}>
                <Link
                  href="/donations/new"
                  className={cn(buttonVariants({ size: "lg" }), "group press-scale shadow-glow")}
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
            </ScrollReveal>

            <ScrollReveal once threshold={0.12}>
              <p className="reveal flex items-center gap-2 text-sm text-muted-foreground" style={{ animationDelay: "300ms" }}>
                <ShieldCheck aria-hidden="true" className="size-4 text-primary" />
                Deterministic matching. No LLM decides who eats.
              </p>
            </ScrollReveal>
          </div>

          <div className="reveal flex flex-col gap-8" style={{ animationDelay: "380ms" }}>
            {/* Hero match card — glassmorphism + organic leaf */}
            <Card className="relative overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-lifted image-outline hover-lift press-scale group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors duration-700" />
              <div className="absolute -right-6 -bottom-6 size-48 opacity-20 group-hover:opacity-35 transition-opacity duration-700">
                <OrganicLeaf className="size-full animate-float" style={{ animationDelay: "-1s" }} />
              </div>
              <div className="absolute top-8 left-8 size-12 rounded-full bg-warning/20 flex items-center justify-center">
                <Sprout className="size-5 text-warning" aria-hidden="true" />
              </div>
              <CardHeader className="pt-8 gap-2 z-10 relative">
                <div className="flex items-center justify-between gap-2 z-10 relative">
                  <Badge variant="warning" className="z-10 relative animate-pulse-glow">
                    Critical urgency
                  </Badge>
                  <span className="z-10 relative text-xs text-muted-foreground">
                    Example match
                  </span>
                </div>
                <CardTitle className="text-xl font-display z-10 relative">Vegetable biryani</CardTitle>
                <CardDescription className="z-10 relative">
                  40 servings · prepared meal · Indiranagar
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
                      <dd className="text-right font-medium data-[tabular]">
                        {row.value}
                      </dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-5 flex items-center gap-2 rounded-xl bg-secondary px-3.5 py-2.5 text-xs text-secondary-foreground z-10 relative">
                  <Clock aria-hidden="true" className="size-3.5" />
                  Match score 92 · explained component by component
                </div>
              </CardContent>
            </Card>

            {/* Hero stats — animated counters */}
            <div className="grid gap-5 sm:grid-cols-3 stagger">
              {HERO_STATS.map((stat, i) => (
                <AnimatedCounter
                  key={stat.label}
                  value={stat.value}
                  label={stat.label}
                  delay={`${200 + i * 120}ms`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Marquee — moving city names, Indian feel */}
      <section aria-hidden="true" className="border-b border-border bg-secondary/30">
        <div className="px-4 py-6 sm:px-6 overflow-hidden">
          <div className="flex w-full items-center overflow-x-hidden">
            {MARQUEE_ITEMS.map((items, i) => (
              <div key={i} className="marquee-content whitespace-nowrap text-xs text-muted-foreground uppercase tracking-widest">
                {items}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The gap — problem statement */}
      <section
        aria-labelledby="gap-title"
        className="border-b border-border bg-secondary/40 relative overflow-hidden"
      >
        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-14 px-4 py-28 sm:px-6 lg:grid-cols-1.1fr lg:py-36">
          <div className="flex flex-col gap-5 lg:pr-10">
            <ScrollReveal once threshold={0.1}>
              <p className="reveal text-sm font-semibold tracking-wide text-primary uppercase" style={{ animationDelay: "60ms" }}>
                The gap
              </p>
            </ScrollReveal>
            <ScrollReveal once threshold={0.12}>
              <h2 id="gap-title" className="reveal text-3xl font-display font-bold tracking-tight text-balance sm:text-4xl" style={{ animationDelay: "80ms" }}>
                Good food is thrown away while people nearby go hungry.
              </h2>
            </ScrollReveal>
            <ScrollReveal once threshold={0.12}>
              <p className="reveal text-lg text-pretty leading-relaxed text-muted-foreground" style={{ animationDelay: "160ms" }}>
                Surplus is rarely a lack of goodwill. Kitchens cannot tell, in
                time, who can collect the food before it is unsafe, and
                recipient organisations cannot tell what is available within
                their storage, transport and kitchen capacity.
              </p>
            </ScrollReveal>
          </div>
          <div className="flex flex-col gap-5 reveal" style={{ animationDelay: "240ms" }}>
            <ul className="grid gap-5 text-sm sm:grid-cols-3">
              {[
                {
                  title: "Deadlines, not guesses",
                  body: "Use-by, best-before and pickup deadlines stay separate.",
                },
                {
                  title: "Capacity-aware",
                  body: "Storage, vehicle space and servings are hard filters.",
                },
                {
                  title: "Explainable",
                  body: "Every match shows urgency, distance, quantity and needs scores.",
                },
              ].map((item, index) => (
                <li
                  key={item.title}
                  className="rounded-[2rem] border border-border bg-card p-6 shadow-soft hover-lift press-scale reveal"
                  style={{ animationDelay: `${300 + index * 100}ms` }}
                >
                  <span className="block font-semibold text-primary">
                    {item.title}
                  </span>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="flow-title" className="border-b border-border relative overflow-hidden">
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:py-36">
          <div className="flex flex-col gap-5 reveal" style={{ animationDelay: "60ms" }}>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              How it works
            </p>
            <h2 id="flow-title" className="max-w-2xl text-3xl font-display font-bold tracking-tight text-balance sm:text-4xl">
              Three steps from surplus to a shared meal.
            </h2>
          </div>
          <StaggerScrollReveal once threshold={0.12}>
            <ol className="mt-16 grid gap-10 md:grid-cols-3">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex flex-col gap-4 reveal">
                  <Card className="flex-1 flex flex-col gap-4 p-7 shadow-soft hover-lift press-scale group">
                    <CardHeader className="gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className={cn(
                            "grid size-11 place-items-center rounded-[1.5rem] bg-primary/10 text-lg font-display font-bold text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300 press-scale"
                          )}
                        >
                          {index + 1}
                        </span>
                        <step.icon
                          aria-hidden="true"
                          className="size-5 text-primary group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                      <CardDescription>{step.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </li>
              ))}
            </ol>
          </StaggerScrollReveal>
        </div>
      </section>

      {/* Impact */}
      <section aria-labelledby="impact-title" className="border-b border-border bg-primary text-primary-foreground relative overflow-hidden">
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 sm:px-6">
          <div className="flex flex-col gap-4 reveal" style={{ animationDelay: "80ms" }}>
            <h2 id="impact-title" className="text-2xl font-display font-bold tracking-tight">
              What rescue looks like
            </h2>
            <p className="max-w-2xl text-sm text-primary-foreground/80 text-pretty">
              Demo data. These figures illustrate the dashboard and are not live
              impact measurements.
            </p>
          </div>
          <StaggerScrollReveal once threshold={0.12}>
            <dl className="mt-14 grid gap-10 sm:grid-cols-3">
              {IMPACT.map((stat, i) => (
                <div key={stat.label} className="flex flex-col gap-2">
                  <AnimatedCounter
                    value={stat.value}
                    label={stat.label}
                    delay={`${i * 100}ms`}
                  />
                </div>
              ))}
            </dl>
          </StaggerScrollReveal>
        </div>
      </section>

      {/* Roles */}
      <section aria-labelledby="roles-title" className="border-b border-border relative overflow-hidden">
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:py-36">
          <div className="flex flex-col gap-5 reveal" style={{ animationDelay: "60ms" }}>
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Built for every side of the handover
            </p>
            <h2 id="roles-title" className="max-w-2xl text-3xl font-display font-bold tracking-tight text-balance sm:text-4xl">
              One workspace per role, one shared deadline.
            </h2>
          </div>
          <StaggerScrollReveal once threshold={0.12}>
            <div className="mt-16 grid gap-10 lg:grid-cols-3">
              {ROLES.map((role) => (
                <Card key={role.name} className="flex-1 flex flex-col justify-between p-7 shadow-soft hover-lift press-scale">
                  <CardHeader className="gap-3">
                    <span className={cn(
                      "grid size-11 place-items-center rounded-[1.5rem] bg-secondary text-primary press-scale"
                    )}>
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
          </StaggerScrollReveal>
        </div>
      </section>

      {/* CTA */}
      <section aria-labelledby="cta-title" className="relative overflow-hidden">
        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-28 sm:px-6 lg:py-36">
          <div className="flex flex-col gap-8 reveal rounded-[3rem] border border-border bg-primary/10 px-8 py-20 sm:px-12 lg:flex-row lg:items-center lg:justify-between" style={{ animationDelay: "100ms" }}>
            <div className="flex max-w-2xl flex-col gap-3">
              <h2 id="cta-title" className="text-3xl font-display font-bold tracking-tight text-balance">
                Rescue tonight&apos;s surplus instead of binning it.
              </h2>
              <p className="text-muted-foreground text-pretty leading-relaxed">
                Start with a draft, add a photo if you have one, and publish
                when the pickup details are ready.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 reveal" style={{ animationDelay: "180ms" }}>
              <Link href="/donations/new" className={cn(buttonVariants({ size: "lg" }), "press-scale shadow-glow")}>
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
          <p className="mt-10 text-xs text-muted-foreground reveal" style={{ animationDelay: "260ms" }}>
            Aahaarloop helps route surplus food; it does not certify that food is
            safe to eat. Donors and recipients remain responsible for food
            safety. Diet and allergen filters are preferences, not guarantees.
          </p>
        </div>
      </section>
    </div>
  );
}
