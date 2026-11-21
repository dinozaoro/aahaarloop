import type { Metadata } from "next";
import Link from "next/link";

import {
  matchDonationsForRecipient,
  type DonationCandidate,
  type EligibleMatch,
  type RecipientRequest,
} from "@aahaarloop/matching";

import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Clock, PackageCheck, ShieldCheck } from "lucide-react";
import { ScrollReveal, StaggerScrollReveal } from "@/components/scroll-reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Donor dashboard",
};

const emptyRecipient: RecipientRequest = {
  id: "recipient-1",
  location: { latitude: 0, longitude: 0 },
  needs: [],
  requiredServings: 40,
  storage: "ambient",
  transportCapacityKg: 50,
  volunteerAvailability: [],
};

const demoDonations: readonly DonationCandidate[] = [
  {
    id: "don-001",
    location: { latitude: 12.965, longitude: 77.62 },
    categories: ["produce", "prepared"],
    storage: "chilled",
    totalServings: 80,
    availableServings: 40,
    totalWeightKg: 24,
    foodExpiryAt: "2026-11-21T18:00:00+05:30",
    pickupDeadlineAt: "2026-11-21T17:30:00+05:30",
  },
  {
    id: "don-002",
    location: { latitude: 12.97, longitude: 77.64 },
    categories: ["bakery"],
    storage: "ambient",
    totalServings: 50,
    availableServings: 50,
    totalWeightKg: 12,
    pickupDeadlineAt: "2026-11-21T14:00:00+05:30",
  },
  {
    id: "don-003",
    location: { latitude: 12.94, longitude: 77.58 },
    categories: ["produce"],
    storage: "ambient",
    totalServings: 120,
    availableServings: 120,
    totalWeightKg: 40,
    pickupDeadlineAt: "2026-11-22T10:00:00+05:30",
  },
  {
    id: "don-004",
    location: { latitude: 12.98, longitude: 77.61 },
    categories: ["prepared"],
    storage: "frozen",
    totalServings: 30,
    availableServings: 10,
    totalWeightKg: 9,
    pickupDeadlineAt: "2026-11-21T13:00:00+05:30",
  },
];

const NOW = "2026-11-21T10:00:00Z";

function urgencyBadge(level: string) {
  const variants: Record<string, BadgeVariant> = {
    critical: "destructive",
    high: "warning",
    medium: "secondary",
    low: "outline",
  };
  const labels: Record<string, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return (
    <Badge variant={variants[level]} className="capitalize press-scale">
      {labels[level]}
    </Badge>
  );
}

export default function DashboardPage() {
  const { matches } = matchDonationsForRecipient(
    emptyRecipient,
    demoDonations,
    { now: NOW }
  );

  const active = matches.filter(
    (m) => m.explanation.urgency.level === "critical" || m.explanation.urgency.level === "high"
  );
  const expiring = matches.filter(
    (m) => m.explanation.urgency.level === "medium"
  );
  const history = matches.filter(
    (m) => m.explanation.urgency.level === "low"
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-10 reveal [animation-delay:60ms]">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-display font-bold tracking-tight text-balance sm:text-4xl">
            Donor dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Surplus published, matched and ready for collection.
          </p>
        </div>
        <Link
          href="/donations/new"
          className={cn(buttonVariants(), "press-scale shadow-glow")}
        >
          Create a donation
        </Link>
      </header>

      {/* KPI strip */}
      <StaggerScrollReveal once threshold={0.12}>
        <div className="grid gap-5 sm:grid-cols-3 mb-10">
          <Card className="p-5 shadow-soft hover-lift press-scale reveal [animation-delay:60ms]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total published
              </CardTitle>
              <span className="text-2xl font-display font-bold data-[tabular]">
                {demoDonations.length}
              </span>
            </CardHeader>
          </Card>
          <Card className="p-5 shadow-soft hover-lift press-scale reveal [animation-delay:140ms]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Claimable now
              </CardTitle>
              <span className="text-2xl font-display font-bold data-[tabular] text-primary">
                {active.length}
              </span>
            </CardHeader>
          </Card>
          <Card className="p-5 shadow-soft hover-lift press-scale reveal [animation-delay:220ms]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Expiring soon
              </CardTitle>
              <span className="text-2xl font-display font-bold data-[tabular] text-warning">
                {expiring.length}
              </span>
            </CardHeader>
          </Card>
        </div>
      </StaggerScrollReveal>

      {/* Active section */}
      {active.length > 0 && (
        <section className="mb-10 reveal [animation-delay:300ms]">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-display font-bold tracking-tight">
              Ready to collect
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Claim before the deadline
            </p>
          </div>
          <StaggerScrollReveal once threshold={0.12}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((match) => (
                <DonationCard key={match.donationId} match={match} variant="critical" />
              ))}
            </div>
          </StaggerScrollReveal>
        </section>
      )}

      {/* Expiring section */}
      {expiring.length > 0 && (
        <section className="mb-10 reveal [animation-delay:380ms]">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-display font-bold tracking-tight">
              Expiring soon
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Medium urgency — act today
            </p>
          </div>
          <StaggerScrollReveal once threshold={0.12}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {expiring.map((match) => (
                <DonationCard key={match.donationId} match={match} variant="high" />
              ))}
            </div>
          </StaggerScrollReveal>
        </section>
      )}

      {/* History section */}
      {history.length > 0 && (
        <section className="reveal [animation-delay:460ms]">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-display font-bold tracking-tight">
              History
            </h2>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Low urgency or collected
            </p>
          </div>
          <StaggerScrollReveal once threshold={0.12}>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {history.map((match) => (
                <DonationCard key={match.donationId} match={match} variant="low" />
              ))}
            </div>
          </StaggerScrollReveal>
        </section>
      )}

      {matches.length === 0 && (
        <Card className="p-14 text-center shadow-soft reveal">
          <ShieldCheck className="mx-auto size-14 text-muted-foreground mb-5" />
          <h3 className="text-lg font-display font-bold">No donations yet</h3>
          <p className="text-muted-foreground mt-3">
            Publish your first surplus and let Aahaarloop match it.
          </p>
          <Link
            href="/donations/new"
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline press-scale"
          >
            Create a donation
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Card>
      )}
    </div>
  );
}

function DonationCard({ match, variant }: { match: EligibleMatch; variant: string }) {
  const { explanation } = match;
  const { urgency, distance, quantity, needs, availability, logistics } = explanation;

  return (
    <Card
      className={cn(
        "flex flex-col gap-4 p-5 shadow-soft hover-lift press-scale border-l-3",
        variant === "critical"
          ? "border-destructive/50 bg-destructive/5"
          : variant === "high"
            ? "border-warning/50 bg-warning/5"
            : "border-border"
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PackageCheck className="size-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Donation {match.donationId.slice(-4)}
            </span>
          </div>
          {urgencyBadge(urgency.level)}
        </div>
        <CardTitle className="text-lg">{match.claimableServings} servings</CardTitle>
        <CardDescription>{urgency.remainingMinutes} min remaining</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Urgency</span>
            <span className="font-medium data-[tabular]">{urgency.level}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Distance</span>
            <span className="font-medium data-[tabular]">{distance.distanceKm} km</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Quantity fit</span>
            <span className="font-medium data-[tabular]">{quantity.claimableServings} servings</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Needs match</span>
            <span className="font-medium data-[tabular]">
              {needs.matchedCategories.join(" · ") || "—"}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden="true" />
          <span>Pickup within {Math.round(urgency.travelTimeMinutes)} min</span>
        </div>
        <Link
          href="/dashboard"
          className="text-xs font-semibold text-primary underline-offset-4 hover:underline press-scale"
        >
          View details
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
