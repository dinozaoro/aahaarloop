import type { Claim, PickupTask } from "../domain/types.ts";
import type { NotifyInput } from "./service.ts";

/** One builder per domain trigger; each returns a single, deduplicable input. */
export const notificationTriggers = {
  claimCreated(claim: Claim, recipientUserId: string): NotifyInput {
    return {
      type: "claim_created",
      title: "Claim submitted",
      body: `Your claim for ${claim.donationTitle} is pending confirmation.`,
      entityType: "claim",
      entityId: claim.id,
      recipients: [recipientUserId],
      data: { donationId: claim.donationId, servings: claim.servings },
    };
  },

  claimCancelled(claim: Claim, donorUserId: string, reason: string): NotifyInput {
    return {
      type: "claim_cancelled",
      title: "Claim cancelled",
      body: `A claim for ${claim.donationTitle} was cancelled: ${reason}`,
      entityType: "claim",
      entityId: claim.id,
      recipients: [donorUserId],
      data: { reason, servings: claim.servings },
    };
  },

  claimExpired(claim: Claim, recipientUserId: string): NotifyInput {
    return {
      type: "claim_expired",
      title: "Claim expired",
      body: `Your claim for ${claim.donationTitle} expired and was released.`,
      entityType: "claim",
      entityId: claim.id,
      recipients: [recipientUserId],
    };
  },

  pickupAssigned(task: PickupTask, volunteerUserId: string): NotifyInput {
    return {
      type: "pickup_assigned",
      title: "New pickup assigned",
      body: `Pickup at ${task.address} has been assigned to you.`,
      entityType: "pickup_task",
      entityId: task.id,
      recipients: [volunteerUserId],
      data: { donationId: task.donationId },
    };
  },

  pickupCompleted(task: PickupTask, donorUserId: string): NotifyInput {
    return {
      type: "pickup_completed",
      title: "Pickup completed",
      body: `The pickup for donation ${task.donationId} was completed.`,
      entityType: "pickup_task",
      entityId: task.id,
      recipients: [donorUserId],
    };
  },

  delivered(claim: Claim, recipientUserId: string): NotifyInput {
    return {
      type: "delivered",
      title: "Delivery confirmed",
      body: `Your ${claim.donationTitle} delivery is confirmed.`,
      entityType: "claim",
      entityId: claim.id,
      recipients: [recipientUserId],
    };
  },

  deadlineApproaching(
    claim: Claim,
    recipientUserId: string,
    hours: number,
  ): NotifyInput {
    return {
      type: "deadline_approaching",
      title: "Pickup deadline approaching",
      body: `Collect ${claim.donationTitle} within ${hours} hours.`,
      entityType: "claim",
      entityId: claim.id,
      recipients: [recipientUserId],
      data: { hours },
    };
  },
};
