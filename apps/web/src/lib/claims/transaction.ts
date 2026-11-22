import { ApiError } from "../api/errors.ts";
import type { Claim, ClaimItemPortion, Donation } from "../domain/types.ts";

export interface ClaimRepository {
  findDonation(id: string): Promise<Donation | undefined>;
  findByIdempotencyKey(key: string): Promise<Claim | undefined>;
  saveDonation(donation: Donation, actor: string): Promise<void>;
  saveClaim(claim: Claim, actor: string): Promise<void>;
  appendEvent(donationId: string, type: "claimed" | "edited", actor: string): Promise<void>;
}

export interface ClaimCommand {
  donationId: string;
  recipientOrgId: string;
  servings: number;
  note?: string;
  actorId: string;
  idempotencyKey: string;
  items?: ClaimItemPortion[];
}

/**
 * Serializes mutations within one worker; the claims unique index stops a
 * second worker from creating the same claim.
 */
export function createClaimService(
  repo: ClaimRepository,
  now: () => string = () => new Date().toISOString(),
) {
  let tail: Promise<unknown> = Promise.resolve();
  const locked = <T>(work: () => T | Promise<T>): Promise<T> => {
    const result = tail.then(work, work);
    tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  return {
    create(command: ClaimCommand): Promise<Claim> {
      return locked(async () => {
        const replay = await repo.findByIdempotencyKey(command.idempotencyKey);
        if (replay) return replay;

        const donation = await repo.findDonation(command.donationId);
        if (!donation) throw new ApiError("not_found", "Donation not found");
        if (donation.status !== "published") {
          throw new ApiError("conflict", "Donation is not available for claiming");
        }
        if (
          !Number.isInteger(command.servings) ||
          command.servings <= 0 ||
          command.servings > donation.servingsAvailable
        ) {
          throw new ApiError("conflict", "Requested quantity is not available");
        }

        const items = command.items ?? [
          { name: donation.title, quantity: command.servings },
        ];
        if (
          items.some((item) => !Number.isInteger(item.quantity) || item.quantity <= 0) ||
          items.reduce((sum, item) => sum + item.quantity, 0) !== command.servings
        ) {
          throw new ApiError("validation_error", "Item quantities must sum to the claim");
        }

        const at = now();
        const claim: Claim = {
          id: crypto.randomUUID(),
          idempotencyKey: command.idempotencyKey,
          donationId: donation.id,
          donationTitle: donation.title,
          donorOrganizationId: donation.organizationId,
          recipientOrgId: command.recipientOrgId,
          recipientName: command.recipientOrgId,
          servings: command.servings,
          weightKg: (donation.weightKg / Math.max(1, donation.servingsTotal)) * command.servings,
          items,
          status: "pending",
          createdAt: at,
          updatedAt: at,
          history: [
            { id: crypto.randomUUID(), at, type: "created", actor: command.actorId, note: command.note },
          ],
        };
        const remaining = donation.servingsAvailable - command.servings;
        if (remaining < 0) {
          throw new ApiError("conflict", "Requested quantity is not available");
        }
        const updated: Donation = {
          ...donation,
          servingsAvailable: remaining,
          status: remaining === 0 ? "claimed" : donation.status,
          updatedAt: at,
        };
        await repo.saveClaim(claim, command.actorId);
        await repo.saveDonation(updated, command.actorId);
        await repo.appendEvent(donation.id, "claimed", command.actorId);
        return claim;
      });
    },
  };
}
