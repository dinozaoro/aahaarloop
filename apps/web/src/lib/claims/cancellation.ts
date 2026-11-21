import { ApiError } from "../api/errors.ts";
import type { Claim, Donation } from "../domain/types.ts";

export interface ClaimLifecycleRepository {
  allClaims(): readonly Claim[];
  findClaim(id: string): Claim | undefined;
  findDonation(id: string): Donation | undefined;
  saveClaim(claim: Claim): void;
  saveDonation(donation: Donation): void;
  appendEvent(
    donationId: string,
    type: "cancelled" | "expired",
    actor: string,
  ): void;
}

export interface LifecycleActor {
  id: string;
  role: "donor" | "recipient" | "volunteer" | "admin" | "system";
  organizationId: string | null;
}

const OPEN_STATUSES = new Set(["pending", "confirmed", "pickup_scheduled"]);
const AFTER_PICKUP = new Set(["picked_up", "delivered"]);

function mayCancel(claim: Claim, donation: Donation, actor: LifecycleActor): boolean {
  if (actor.role === "admin" || actor.role === "system") return true;
  if (AFTER_PICKUP.has(claim.status)) return false;
  if (actor.role === "recipient") return claim.recipientOrgId === actor.organizationId;
  return donation.organizationId === actor.organizationId;
}

/** Releases the reserved quantity exactly once, under the caller's lock. */
export function createClaimLifecycle(
  repo: ClaimLifecycleRepository,
  now: () => string = () => new Date().toISOString(),
) {
  const release = (
    claim: Claim,
    status: "cancelled" | "expired",
    actor: LifecycleActor,
    reason?: string,
  ): Claim => {
    if (!OPEN_STATUSES.has(claim.status)) return claim;
    const donation = repo.findDonation(claim.donationId);
    if (!donation) throw new ApiError("not_found", "Donation not found");
    const restored = Math.min(
      donation.servingsTotal,
      donation.servingsAvailable + claim.servings,
    );
    repo.saveDonation({
      ...donation,
      servingsAvailable: restored,
      status: donation.status === "claimed" && restored > 0 ? "published" : donation.status,
      updatedAt: now(),
    });
    const closed: Claim = {
      ...claim,
      status,
      ...(status === "cancelled" ? { cancelledAt: now(), cancelReason: reason } : {}),
      updatedAt: now(),
      history: [
        ...claim.history,
        { id: crypto.randomUUID(), at: now(), type: status, actor: actor.id, note: reason },
      ],
    };
    repo.saveClaim(closed);
    repo.appendEvent(claim.donationId, status, actor.id);
    return closed;
  };

  return {
    cancel(claimId: string, actor: LifecycleActor, reason: string): Claim {
      if (!reason.trim()) throw new ApiError("validation_error", "A cancel reason is required");
      const claim = repo.findClaim(claimId);
      if (!claim) throw new ApiError("not_found", "Claim not found");
      const donation = repo.findDonation(claim.donationId);
      if (!donation) throw new ApiError("not_found", "Donation not found");
      if (!mayCancel(claim, donation, actor)) {
        throw new ApiError("forbidden", "This claim cannot be cancelled by this actor");
      }
      if (!OPEN_STATUSES.has(claim.status)) {
        throw new ApiError("conflict", "Only open claims can be cancelled");
      }
      return release(claim, "cancelled", actor, reason.trim());
    },

    expire(): Claim[] {
      const current = Date.parse(now());
      const expired = repo.allClaims().filter(
        (claim) =>
          OPEN_STATUSES.has(claim.status) &&
          claim.expiresAt != null &&
          Date.parse(claim.expiresAt) <= current,
      );
      return expired.map((claim) =>
        release(claim, "expired", { id: "system", role: "system", organizationId: null }),
      );
    },
  };
}
