import type { Metadata } from "next";

import {
  matchDonationsForRecipient,
  type DonationCandidate,
  type EligibleMatch,
  type RecipientRequest,
} from "@aahaarloop/matching";

import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowRight, Clock, MapPin, PackageCheck, ShieldCheck, Utensils } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Donor dashboard",
};

const emptyRecipient: RecipientRequest = {
  id: "recipient-1",
  location: { latitude: 0, longitude: 0 },
  needs: [],
  requiredServings: 0,
  storage: "ambient",
  transportCapacityKg: 0,
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
  const variants: Record<string, string> = {
    critical: "badge-destructive",
    high: "badge-warning",
    medium: "badge-secondary",
    low: "badge-outline",
  };
  const labels: Record<string, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  return (
    <Badge variant={variants[level] as any} className="capitalize">
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

  const totalPublished = demoDonations.length;
  const totalServings = demoDonations.reduce((sum, d) => sum + d.availableServings, 0);
  const totalWeightKg = demoDonations.reduce((sum, d) => sum + d.totalWeightKg, 0);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-10">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Logo className="size-5" />
            <h1 className="text-display-3 font-bold tracking-tight text-balance sm:text-display-2">
              Donor dashboard
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Surplus published, matched and ready for collection.
          </p>
        </div>
        <Link
          href="/donations/new"
          className={cn(buttonVariants(), "press-scale")}
        >
          Create a donation
        </Link>
      </header>

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        <KpiCard
          title="Total published"
          value={totalPublished.toString()}
          subtitle="donations listed"
          icon={PackageCheck}
          accent="primary"
          delay="60ms"
        />
        <KpiCard
          title="Claimable now"
          value={active.length.toString()}
          subtitle="urgent pickups"
          icon={ShieldCheck}
          accent="destructive"
          delay="140ms"
        />
        <KpiCard
          title="Expiring soon"
          value={expiring.length.toString()}
          subtitle="medium urgency"
          icon={Clock}
          accent="warning"
          delay="220ms"
        />
        <KpiCard
          title="Servings available"
          value={totalServings.toString()}
          subtitle={totalWeightKg > 0 ? `~${totalWeightKg} kg` : "—"}
          icon={Utensils}
          accent="accent"
          delay="300ms"
        />
      </div>

      {/* Active section */}
      {active.length > 0 && (
        <section className="mb-10 reveal">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-balance">
              Ready to collect
            </h2>
            <p className="text-xs text-muted-foreground">Claim before the deadline.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((match) => (
              <DonationCard key={match.donationId} match={match} variant="critical" />
            ))}
          </div>
        </section>
      )}

      {/* Expiring section */}
      {expiring.length > 0 && (
        <section className="mb-10 reveal">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-balance">
              Expiring soon
            </h2>
            <p className="text-xs text-muted-foreground">Medium urgency — act today.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {expiring.map((match) => (
              <DonationCard key={match.donationId} match={match} variant="high" />
            ))}
          </div>
        </section>
      )}

      {/* History section */}
      {history.length > 0 && (
        <section className="reveal">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-balance">
              History
            </h2>
            <p className="text-xs text-muted-foreground">Low urgency or collected.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {history.map((match) => (
              <DonationCard key={match.donationId} match={match} variant="low" />
            ))}
          </div>
        </section>
      )}

      {matches.length === 0 && (
        <Card className="p-16 text-center shadow-soft reveal">
          <ShieldCheck className="mx-auto size-14 text-muted-foreground mb-5" />
          <h3 className="text-lg font-semibold">No donations yet</h3>
          <p className="text-muted-foreground mt-2">
            Publish your first surplus and let Aahaarloop match it.
          </p>
          <Link
            href="/donations/new"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline press-scale"
          >
            Create a donation
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </Card>
      )}
    </div>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  delay,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent: "primary" | "destructive" | "warning" | "accent";
  delay: string;
}) {
  const accentMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    destructive: "bg-destructive/10 text-destructive",
    warning: "bg-warning/10 text-warning",
    accent: "bg-accent/10 text-accent",
  };
  return (
    <Card
      className={cn(
        "p-5 shadow-soft hover-lift press-scale border-l-2",
        accent === "primary"
          ? "border-primary/50"
          : accent === "destructive"
            ? "border-destructive/50"
            : accent === "warning"
              ? "border-warning/50"
              : "border-accent/50"
      )}
    >
      <div
        className="flex items-center justify-between"
        style={{
          animation: `fade-up var(--duration-hero) var(--ease-out) forwards ${delay}`,
          opacity: "0",
        }}
      >
        <div className="flex flex-col gap-1">
          <p className="text-caption text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <span className="text-display-2 font-bold tracking-tight data-[tabular]">
            {value}
          </span>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className="grid size-10 place-items-center rounded-xl {accentMap[accent]}">
          <Icon aria-hidden="true" className="size-5" />
        </div>
      </div>
    </Card>
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
          ? "border-destructive/60 bg-destructive/4"
          : variant === "high"
            ? "border-warning/60 bg-warning/4"
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
        <CardTitle className="text-lg">{quantity.claimableServings} servings</CardTitle>
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
        {/* Match score bar */}
        <div className="flex items-center gap-2">
          <span className="text-caption text-muted-foreground">Match score</span>
          <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full bg-primary rounded-full animate-shimmer"
              style={{ width: `${Math.round(match.explanation.urgency.score * 0.9 + 10)}%` }}
            />
          </div>
          <span className="text-caption font-medium data-[tabular]">
            {Math.round(match.explanation.urgency.score)}%
          </span>
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

function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src="/assets/aahaaroop.png"
      alt=""
      aria-hidden="true"
      className={cn("size-5 shrink-0 object-contain", className)}
      decoding="async"
    />
  );
}
