import { ApiError } from "../api/errors.ts";
import type {
  Claim,
  Donation,
  ImpactRecord,
  PickupAssignment,
  PickupTask,
} from "../domain/types.ts";

export interface DeliveryRepository {
  findTask(id: string): PickupTask | undefined;
  findAssignment(
    taskId: string,
    volunteerId: string,
  ): PickupAssignment | undefined;
  findClaim(id: string): Claim | undefined;
  findDonation(id: string): Donation | undefined;
  saveTask(task: PickupTask): void;
  saveAssignment(assignment: PickupAssignment): void;
  saveClaim(claim: Claim): void;
  saveDonation(donation: Donation): void;
  saveImpact(record: ImpactRecord): void;
}

export interface DeliveryProof {
  type: "signature" | "photo";
  value: string;
}

export interface DeliveryCommand {
  taskId: string;
  volunteerId: string;
  proof: DeliveryProof;
  deliveredQuantity: number;
  discrepancyNote?: string;
}

export interface DeliveryResult {
  task: PickupTask;
  claim: Claim;
  donation: Donation;
  impact: ImpactRecord;
}

/** Closes a pickup with mandatory proof and an explicit discrepancy record. */
export function createDeliveryService(
  repo: DeliveryRepository,
  now: () => string = () => new Date().toISOString(),
) {
  return {
    confirm(command: DeliveryCommand): DeliveryResult {
      if (
        !command.proof ||
        (command.proof.type !== "signature" &&
          command.proof.type !== "photo") ||
        !command.proof.value.trim()
      ) {
        throw new ApiError(
          "validation_error",
          "A signature or photo proof of delivery is required",
        );
      }
      if (
        !Number.isFinite(command.deliveredQuantity) ||
        command.deliveredQuantity <= 0
      ) {
        throw new ApiError(
          "validation_error",
          "Delivered quantity must be a positive number",
        );
      }

      const task = repo.findTask(command.taskId);
      if (!task) {
        throw new ApiError("not_found", "Pickup task not found");
      }
      if (task.status !== "assigned" && task.status !== "in_progress") {
        throw new ApiError("conflict", "Task is not awaiting delivery");
      }
      const assignment = repo.findAssignment(task.id, command.volunteerId);
      if (!assignment) {
        throw new ApiError(
          "forbidden",
          "Only the assigned volunteer can confirm delivery",
        );
      }
      const claim = repo.findClaim(task.claimId);
      if (!claim) {
        throw new ApiError("not_found", "Claim not found");
      }
      const donation = repo.findDonation(task.donationId);
      if (!donation) {
        throw new ApiError("not_found", "Donation not found");
      }

      const at = now();
      const discrepancy = claim.servings - command.deliveredQuantity;
      const note =
        command.discrepancyNote ??
        (discrepancy !== 0 ? `${discrepancy} servings difference` : null);

      const updatedClaim: Claim = {
        ...claim,
        status: "delivered",
        updatedAt: at,
        history: [
          ...claim.history,
          {
            id: crypto.randomUUID(),
            at,
            type: "delivered",
            actor: command.volunteerId,
            ...(note ? { note } : {}),
          },
        ],
      };
      const updatedDonation: Donation = {
        ...donation,
        status: "delivered",
        updatedAt: at,
        events: [
          ...donation.events,
          {
            id: crypto.randomUUID(),
            at,
            type: "delivered",
            actor: command.volunteerId,
          },
        ],
      };

      const impact: ImpactRecord = {
        id: crypto.randomUUID(),
        organizationId: donation.organizationId,
        donationId: donation.id,
        claimId: claim.id,
        metric: "servings_rescued",
        value: command.deliveredQuantity,
        discrepancy,
        proofType: command.proof.type,
        note,
        recordedAt: at,
      };

      repo.saveTask({ ...task, status: "completed" });
      repo.saveAssignment({ ...assignment, status: "completed" });
      repo.saveClaim(updatedClaim);
      repo.saveDonation(updatedDonation);
      repo.saveImpact(impact);

      return {
        task: { ...task, status: "completed" },
        claim: updatedClaim,
        donation: updatedDonation,
        impact,
      };
    },
  };
}
