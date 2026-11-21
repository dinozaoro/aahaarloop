import {
  matchDonationsForRecipient,
  type DonationCandidate,
  type MatchingConfig,
  type RecipientRequest,
} from "@aahaarloop/matching";
import type { Need } from "@aahaarloop/matching";

import type { Donation, Need as DomainNeed, Organization } from "../domain/types.ts";

export interface MatchFilters {
  category?: string;
  minScore?: number;
  page: number;
  pageSize: number;
}

function toStorage(value: string): "ambient" | "chilled" | "frozen" {
  if (value === "refrigerated") return "chilled";
  return value === "chilled" || value === "frozen" ? value : "ambient";
}

export function toCandidate(donation: Donation): DonationCandidate {
  return {
    id: donation.id,
    location: donation.location,
    categories: [donation.category, ...donation.dietTags],
    storage: toStorage(donation.storage),
    totalServings: donation.servingsTotal,
    availableServings: donation.servingsAvailable,
    totalWeightKg: donation.weightKg,
    ...(donation.foodExpiryAt ? { foodExpiryAt: donation.foodExpiryAt } : {}),
    ...(donation.pickupDeadlineAt
      ? { pickupDeadlineAt: donation.pickupDeadlineAt }
      : {}),
  };
}

export function toNeed(need: DomainNeed): Need {
  return {
    id: need.id,
    category: need.category,
    quantity: need.servings,
    deadlineAt: need.deadlineAt,
    priority:
      need.priority === "urgent"
        ? "high"
        : need.priority === "normal"
          ? "medium"
          : "low",
    notes: need.notes,
    status:
      need.status === "fulfilled" ? "fulfilled" : need.status === "closed" ? "expired" : "active",
    createdAt: need.createdAt,
  };
}

/** Ranks only published donations for the authenticated recipient's org. */
export function rankMatches(
  organization: Organization,
  needs: readonly DomainNeed[],
  donations: readonly Donation[],
  filters: MatchFilters,
  now: string = new Date().toISOString(),
  config?: MatchingConfig,
) {
  const recipient: RecipientRequest = {
    id: organization.id,
    location: organization.location,
    needs: needs.filter((need) => need.organizationId === organization.id).map(toNeed),
    requiredServings: Math.max(1, organization.capacityServings),
    storage: toStorage(organization.storage),
    transportCapacityKg: organization.transportCapacityKg,
    volunteerAvailability: [],
  };
  const visible = donations.filter(
    (donation) =>
      donation.status === "published" && donation.organizationId !== organization.id,
  );
  const result = matchDonationsForRecipient(recipient, visible.map(toCandidate), {
    now,
    ...(config ? { config } : {}),
  });
  const eligible = result.matches.filter(
    (match) =>
      (filters.category === undefined ||
        visible.some(
          (donation) =>
            donation.id === match.donationId && donation.category === filters.category,
        )) &&
      (filters.minScore === undefined || match.totalScore >= filters.minScore),
  );
  const offset = (filters.page - 1) * filters.pageSize;
  return {
    page: filters.page,
    pageSize: filters.pageSize,
    total: eligible.length,
    data: eligible.slice(offset, offset + filters.pageSize),
    excluded: result.excluded,
  };
}

/** Short-lived GET cache; keys never span organizations. */
export function createMatchCache(ttlMs: number, now: () => number = Date.now) {
  const entries = new Map<string, { at: number; value: unknown }>();
  return {
    get<T>(key: string): T | undefined {
      const entry = entries.get(key);
      if (!entry || now() - entry.at >= ttlMs) {
        entries.delete(key);
        return undefined;
      }
      return entry.value as T;
    },
    set<T>(key: string, value: T): void {
      entries.set(key, { at: now(), value });
    },
    invalidateOrganization(organizationId: string): void {
      for (const key of entries.keys()) {
        if (key.startsWith(`${organizationId}:`)) entries.delete(key);
      }
    },
    invalidateAll(): void {
      entries.clear();
    },
  };
}
