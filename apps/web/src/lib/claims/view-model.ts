import { CLAIM_STATUS_LABELS, type Claim, type ClaimStatus } from "../domain/types.ts";

export type ClaimPerspective = "recipient" | "donor" | "admin";

export interface ClaimActor {
  role: "donor" | "recipient" | "volunteer" | "admin";
  organizationId: string | null;
}

export type StatusVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "destructive";

export interface NextAction {
  label: string;
  tone: "primary" | "muted" | "none";
}

export interface ProgressStep {
  status: ClaimStatus;
  label: string;
  state: "done" | "current" | "upcoming" | "closed";
}

const OPEN_STATUSES: readonly ClaimStatus[] = [
  "pending",
  "confirmed",
  "pickup_scheduled",
];
const CLOSED_STATUSES: readonly ClaimStatus[] = ["cancelled", "expired"];
const FLOW: readonly ClaimStatus[] = [
  "pending",
  "confirmed",
  "pickup_scheduled",
  "picked_up",
  "delivered",
];

export function statusVariant(status: ClaimStatus): StatusVariant {
  if (status === "delivered") return "success";
  if (status === "pending") return "warning";
  if (CLOSED_STATUSES.includes(status)) return "destructive";
  if (status === "pickup_scheduled" || status === "picked_up") return "default";
  return "secondary";
}

/** Mirrors the server lifecycle rule; the server remains the source of truth. */
export function canCancelClaim(claim: Claim, actor: ClaimActor): boolean {
  if (!OPEN_STATUSES.includes(claim.status)) return false;
  if (actor.role === "admin") return true;
  if (actor.role === "recipient") {
    return claim.recipientOrgId === actor.organizationId;
  }
  if (actor.role === "donor") {
    return claim.donorOrganizationId === actor.organizationId;
  }
  return false;
}

export function nextAction(
  claim: Claim,
  perspective: ClaimPerspective,
): NextAction {
  switch (claim.status) {
    case "pending":
      return perspective === "donor"
        ? { label: "Confirm this claim", tone: "primary" }
        : { label: "Waiting for donor confirmation", tone: "muted" };
    case "confirmed":
      return perspective === "recipient"
        ? { label: "Arrange the pickup", tone: "primary" }
        : { label: "Pickup to be arranged", tone: "muted" };
    case "pickup_scheduled":
      return { label: "Await pickup", tone: "muted" };
    case "picked_up":
      return perspective === "recipient"
        ? { label: "Confirm delivery", tone: "primary" }
        : { label: "Delivery in progress", tone: "muted" };
    case "delivered":
      return { label: "Completed", tone: "none" };
    case "cancelled":
      return { label: "Cancelled", tone: "none" };
    case "expired":
      return { label: "Expired", tone: "none" };
  }
}

export function claimProgress(claim: Claim): ProgressStep[] {
  if (CLOSED_STATUSES.includes(claim.status)) {
    return [
      {
        status: claim.status,
        label: CLAIM_STATUS_LABELS[claim.status],
        state: "closed",
      },
    ];
  }
  const current = FLOW.indexOf(claim.status);
  return FLOW.map((status, index) => ({
    status,
    label: CLAIM_STATUS_LABELS[status],
    state: index < current ? "done" : index === current ? "current" : "upcoming",
  }));
}

export function toClaimRow(claim: Claim, actor: ClaimActor) {
  const perspective: ClaimPerspective =
    actor.role === "donor" ? "donor" : actor.role === "admin" ? "admin" : "recipient";
  return {
    id: claim.id,
    donationTitle: claim.donationTitle,
    servings: claim.servings,
    status: claim.status,
    statusLabel: CLAIM_STATUS_LABELS[claim.status],
    variant: statusVariant(claim.status),
    next: nextAction(claim, perspective),
    canCancel: canCancelClaim(claim, actor),
    progress: claimProgress(claim),
    history: [...claim.history].reverse(),
  };
}
