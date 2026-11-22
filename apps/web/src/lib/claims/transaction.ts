import { ApiError } from "../api/errors.ts";
import type { Claim, ClaimItemPortion, Donation } from "../domain/types.ts";

export interface ClaimRepository {
  findDonation(id: string): Promise<Donation | undefined>;
  findByIdempotencyKey(key: string): Promise<Claim | undefined>;
  /** Locks the donation row and writes the claim, stock decrement and event atomically. */
  commit(claim: Claim, actor: string): Promise<Claim>;
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

export function createClaimService(
  repo: ClaimRepository,
  now: () => string = () => new Date().toISOString(),
) {
  return {
    async create(command: ClaimCommand): Promise<Claim> {
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
      return repo.commit(claim, command.actorId);
    },
  };
}
