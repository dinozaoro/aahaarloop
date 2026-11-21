"use client";

import Link from "next/link";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  CalendarClock,
  ChefHat,
  ClipboardCheck,
  PackageCheck,
  Plus,
  TriangleAlert,
} from "lucide-react";

import { AsyncState, DemoBanner } from "@/components/async-state";
import { DonationCard } from "@/components/donations/donation-card";
import { PageHeader } from "@/components/page-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CATEGORY_LABELS,
  type NeedPriority,
  type NeedStatus,
  type Donation,
  ACTIVE_DONATION_STATUSES,
  HISTORY_DONATION_STATUSES,
} from "@/lib/domain/types";
import { donationUrgency } from "@/lib/donations/urgency";
import { matchDonationsForRecipient } from "@aahaarloop/matching";
import { getClaimsForDonor, getDonationsForOrganization, getOrganization } from "@/lib/data/store";
import { DEMO_DONOR_ORG_ID } from "@/lib/data/constants";
import { formatServings } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  UrgencyResult,
  UrgencyStatus,
  UrgencyLevel,
} from "@aahaarloop/matching";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Donor dashboard" };

const EXPIRING_WINDOW_MINUTES = 6 * 60;

interface DashboardItem {
  donation: Donation;
  urgency: UrgencyResult;
  claims: import("@/lib/domain/types").Claim[];
}

function byRemaining(a: DashboardItem, b: DashboardItem) {
  return (
    (a.urgency.remainingMinutes ?? Number.POSITIVE_INFINITY) -
    (b.urgency.remainingMinutes ?? Number.POSITIVE_INFINITY)
  );
}

interface StatItem {
  label: string;
  value: number;
  hint: string;
  icon:
    | typeof PackageCheck
    | typeof ChefHat
    | typeof ClipboardCheck
    | typeof TriangleAlert
    | typeof Plus;
}

export default function DashboardPage() {
  const now = new Date();
  const organization = getOrganization(DEMO_DONOR_ORG_ID);
  const donations = getDonationsForOrganization(DEMO_DONOR_ORG_ID);
  const donorClaims = getClaimsForDonor(DEMO_DONOR_ORG_ID);

  // Matching engine integration: rank donations for the demo recipient
  const recipientRequest: import("@aahaarloop/matching").RecipientRequest = {
    id: "recipient-demo",
    location: organization?.location ?? { latitude: 12.97, longitude: 77.61 },
    needs: [], // no category preference in demo
    requiredServings: 0,
    storage: "chilled",
    transportCapacityKg: 500,
    volunteerAvailability: [],
  };

  const { matches: candidates } = matchDonationsForRecipient(
    donations,
    recipientRequest
  );

  const items: DashboardItem[] = donations.map((donation) => ({
    donation,
    urgency: donationUrgency(donation, now),
    claims: donorClaims.filter((claim) => claim.donationId === donation.id),
  }));

  const active = items
    .filter((item) => ACTIVE_DONATION_STATUSES.includes(item.donation.status))
    .sort(byRemaining);
  const expiringSoon = active.filter(
    (item) =>
      item.urgency.status === "active" &&
      (item.urgency.remainingMinutes ?? Number.POSITIVE_INFINITY) <=
        EXPIRING_WINDOW_MINUTES
  );
  const history = items
    .filter((item) => HISTORY_DONATION_STATUSES.includes(item.donation.status))
    .sort(
      (a, b) =>
        new Date(b.donation.updatedAt).getTime() -
        new Date(a.donation.updatedAt).getTime()
    );

  const pendingClaims = donorClaims.filter((claim) => claim.status === "pending");
  const availableServings = active.reduce(
    (total, item) => total + item.donation.servingsAvailable,
    0
  );
  const deliveredServings = items
    .filter((item) => item.donation.status === "delivered")
    .reduce(
      (total, item) => total + (item.donation.servingsTotal - item.donation.servingsAvailable),
      0
    );

  // Use matching engine candidates to supplement the dashboard view
  const candidateIds = new Set(candidates.map((c) => c.donationId));

  const stats = [
    {
      label: "Active donations",
      value: active.length,
      hint: `${formatServings(availableServings)} still available`,
      icon: PackageCheck,
    },
    {
      label: "Expiring within 6 h",
      value: expiringSoon.length,
      hint: "Pickup window closes soon",
      icon: TriangleAlert,
    },
    {
      label: "Claims to confirm",
      value: pendingClaims.length,
      hint:
        pendingClaims.length === 0 ? "Nothing waiting" : "Recipients are waiting",
      icon: ClipboardCheck,
    },
    {
      label: "Meals delivered",
      value: deliveredServings,
      hint: "Across completed donations",
      icon: ChefHat,
    },
  ] as const;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow={
          <p className="text-sm text-muted-foreground">
            {organization?.name ?? "Your organization"}
            {organization?.verified ? (
              <Badge variant="success" className="ml-2">
                Verified
              </Badge>
            ) : null}
          </p>
        }
        title="Donor dashboard"
        description="Everything that needs action before the food expires. Deadlines use the shared urgency rules from the matching engine."
        actions={
          <Link
            href="/donations/new"
            className={cn(buttonVariants(), "gap-2")}
          >
            <Plus aria-hidden="true" /> New donation
          </Link>
        }
      />

      <DemoBanner />

      <section
        aria-labelledby="stats-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="stats-heading" className="text-lg font-semibold">
          At a glance
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="gap-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </dt>
                <dd className="text-2xl font-bold">
                  {stat.value}
                </dd>
              </div>
              <p className="text-sm text-muted-foreground">{stat.hint}</p>
            </Card>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="active-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="active-heading" className="text-lg font-semibold">
          Active donations
        </h2>
        <p className="text-sm text-muted-foreground">
          {active.length} donation{active.length !== 1 ? "s" : ""} en cours
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((item, i) => (
            <DonationCard
              key={item.donation.id}
              donation={item.donation}
              urgency={item.urgency}
              claims={item.claims}
              href={candidateIds.has(item.donation.id)
                ? `/donations/${item.donation.id}/detail`
                : undefined}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="expiring-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="expiring-heading" className="text-lg font-semibold">
          Expiring soon
        </h2>
        <p className="text-sm text-muted-foreground">
          {expiringSoon.length} donation{expiringSoon.length !== 1 ? "s" : ""}
          avec fenêtre de pickup dans les 6 h
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {expiringSoon.map((item, i) => (
            <DonationCard
              key={item.donation.id}
              donation={item.donation}
              urgency={item.urgency}
              claims={item.claims}
              href={candidateIds.has(item.donation.id)
                ? `/donations/${item.donation.id}/detail`
                : undefined}
            />
          ))}
        </div>
      </section>

      <section
        aria-labelledby="history-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="history-heading" className="text-lg font-semibold">
          History
        </h2>
        <p className="text-sm text-muted-foreground">
          {history.length} donation{history.length !== 1 ? "s" : ""} terminées
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {history.map((item, i) => (
            <DonationCard
              key={item.donation.id}
              donation={item.donation}
              urgency={{
                status: "active" as UrgencyStatus,
                remainingMinutes: 0,
                level: null,
                claimable: false,
                effectiveDeadlineAt: null,
              }}
              claims={item.claims}
              href={undefined}
            />
          ))}
        </div>
      </section>
    </div>
  );
}