import { effectiveDeadlineAt } from "./dates.ts";
import type { ClaimStatus, DonationStatus } from "./vocabulary.ts";

export type ActorType =
  "donor" | "recipient" | "volunteer" | "admin" | "system";

export interface Actor {
  id: string;
  type: ActorType;
  /** Organization the actor belongs to; required for donor and recipient. */
  organization_id?: string;
}

export interface DonationState {
  id: string;
  donor_organization_id: string;
  status: DonationStatus;
  available_servings: number;
  food_expiry_at?: string | null;
  pickup_deadline_at?: string | null;
}

export interface ClaimState {
  id: string;
  donation_id: string;
  recipient_organization_id: string;
  status: ClaimStatus;
  servings: number;
}

/** Mirrors the append-only donation_events table in packages/database. */
export interface LifecycleEvent {
  id: string;
  donation_id: string;
  claim_id?: string;
  actor_type: ActorType;
  actor_id: string;
  from_status: DonationStatus | ClaimStatus;
  to_status: DonationStatus | ClaimStatus;
  reason: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
}

export type AppendEvent = (event: LifecycleEvent) => Promise<void> | void;

export interface TransitionContext {
  actor: Actor;
  now: string;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export type TransitionCode =
  | "invalid_transition"
  | "unauthorized_actor"
  | "reason_required"
  | "donation_expired"
  | "invalid_quantity"
  | "invalid_date";

export interface TransitionFailure {
  ok: false;
  code: TransitionCode;
  message: string;
}

export type DonationTransitionResult =
  | { ok: true; donation: DonationState; event: LifecycleEvent }
  | TransitionFailure;

export type ClaimTransitionResult =
  | {
      ok: true;
      claim: ClaimState;
      donation: DonationState;
      event: LifecycleEvent;
    }
  | TransitionFailure;

interface Rule<T extends string> {
  to: T;
  actors: readonly ActorType[];
  reason?: boolean;
  checkQuantity?: boolean;
}

/** The only allowed donation transitions. Terminal states have no outgoing rule. */
export const DONATION_TRANSITIONS: Record<
  DonationStatus,
  readonly Rule<DonationStatus>[]
> = {
  draft: [
    { to: "published", actors: ["donor", "admin"] },
    { to: "cancelled", actors: ["donor", "admin"], reason: true },
  ],
  published: [
    { to: "claimed", actors: ["donor", "admin", "system"] },
    { to: "cancelled", actors: ["donor", "admin"], reason: true },
    { to: "expired", actors: ["system"] },
  ],
  claimed: [
    { to: "pickup_scheduled", actors: ["donor", "admin", "volunteer"] },
    { to: "cancelled", actors: ["donor", "admin"], reason: true },
    { to: "expired", actors: ["system"] },
  ],
  pickup_scheduled: [
    { to: "picked_up", actors: ["volunteer", "admin"] },
    { to: "cancelled", actors: ["donor", "admin"], reason: true },
    { to: "expired", actors: ["system"] },
  ],
  picked_up: [{ to: "delivered", actors: ["volunteer", "admin"] }],
  delivered: [],
  cancelled: [],
  expired: [],
};

/** The only allowed claim transitions. A claim starts in `pending`. */
export const CLAIM_TRANSITIONS: Record<
  ClaimStatus,
  readonly Rule<ClaimStatus>[]
> = {
  pending: [
    {
      to: "confirmed",
      actors: ["donor", "admin"],
      checkQuantity: true,
    },
    { to: "cancelled", actors: ["recipient", "donor", "admin"], reason: true },
    { to: "expired", actors: ["system"] },
  ],
  confirmed: [
    { to: "pickup_scheduled", actors: ["donor", "volunteer", "admin"] },
    { to: "cancelled", actors: ["recipient", "donor", "admin"], reason: true },
  ],
  pickup_scheduled: [
    { to: "picked_up", actors: ["volunteer", "admin"] },
    { to: "cancelled", actors: ["recipient", "donor", "admin"], reason: true },
  ],
  picked_up: [{ to: "delivered", actors: ["volunteer", "admin"] }],
  delivered: [],
  cancelled: [],
  expired: [],
};

/** True once the effective hard deadline has passed (inclusive). */
export function isExpired(
  donation: Pick<DonationState, "food_expiry_at" | "pickup_deadline_at">,
  now: string,
): boolean {
  const deadline = effectiveDeadlineAt(donation);
  return deadline != null && Date.parse(deadline) <= Date.parse(now);
}

function fail(code: TransitionCode, message: string): TransitionFailure {
  return { ok: false, code, message };
}

function checkGuards(
  rule: Rule<string>,
  context: TransitionContext,
  donation: DonationState,
  claim?: ClaimState,
): TransitionFailure | null {
  const { actor, now, reason } = context;
  if (Number.isNaN(Date.parse(now))) {
    return fail("invalid_date", "now must be a valid ISO date-time");
  }
  if (!rule.actors.includes(actor.type)) {
    return fail(
      "unauthorized_actor",
      `${actor.type} cannot perform this transition`,
    );
  }
  if (
    actor.type === "donor" &&
    actor.organization_id !== donation.donor_organization_id
  ) {
    return fail("unauthorized_actor", "donor does not own the donation");
  }
  if (
    actor.type === "recipient" &&
    (!claim || actor.organization_id !== claim.recipient_organization_id)
  ) {
    return fail("unauthorized_actor", "recipient does not own the claim");
  }
  if (rule.reason && !reason?.trim()) {
    return fail("reason_required", "a non-empty reason is required");
  }
  if (
    isExpired(donation, now) &&
    rule.to !== "expired" &&
    rule.to !== "cancelled"
  ) {
    return fail(
      "donation_expired",
      "the donation effective deadline has passed",
    );
  }
  if (
    !Number.isInteger(donation.available_servings) ||
    donation.available_servings < 0
  ) {
    return fail(
      "invalid_quantity",
      "available_servings must be a non-negative integer",
    );
  }
  if (claim && (!Number.isInteger(claim.servings) || claim.servings <= 0)) {
    return fail(
      "invalid_quantity",
      "claim servings must be a positive integer",
    );
  }
  if (
    rule.checkQuantity &&
    claim &&
    claim.servings > donation.available_servings
  ) {
    return fail("invalid_quantity", "claim servings exceed available servings");
  }
  return null;
}

function makeEvent(
  donation: DonationState,
  claim: ClaimState | undefined,
  from: DonationStatus | ClaimStatus,
  to: DonationStatus | ClaimStatus,
  context: TransitionContext,
  metadata: Record<string, unknown>,
): LifecycleEvent {
  const stateId = claim?.id ?? donation.id;
  return {
    id: `${stateId}:${to}:${context.now}:${context.actor.id}`,
    donation_id: donation.id,
    ...(claim ? { claim_id: claim.id } : {}),
    actor_type: context.actor.type,
    actor_id: context.actor.id,
    from_status: from,
    to_status: to,
    reason:
      context.reason?.trim() ??
      (to === "expired" ? "effective deadline passed" : null),
    metadata: { ...context.metadata, ...metadata },
    occurred_at: context.now,
  };
}

export async function transitionDonation(
  donation: DonationState,
  to: DonationStatus,
  context: TransitionContext,
  appendEvent: AppendEvent,
): Promise<DonationTransitionResult> {
  const rule = DONATION_TRANSITIONS[donation.status].find(
    (item) => item.to === to,
  );
  if (!rule) {
    return fail(
      "invalid_transition",
      `${donation.status} -> ${to} is not allowed`,
    );
  }
  const failure = checkGuards(rule, context, donation);
  if (failure) return failure;

  const event = makeEvent(
    donation,
    undefined,
    donation.status,
    to,
    context,
    {},
  );
  await appendEvent(event);
  return { ok: true, donation: { ...donation, status: to }, event };
}

/** Confirming a claim decrements available servings; the caller owns the claim write. */
export async function transitionClaim(
  claim: ClaimState,
  donation: DonationState,
  to: ClaimStatus,
  context: TransitionContext,
  appendEvent: AppendEvent,
): Promise<ClaimTransitionResult> {
  const rule = CLAIM_TRANSITIONS[claim.status].find((item) => item.to === to);
  if (!rule) {
    return fail(
      "invalid_transition",
      `${claim.status} -> ${to} is not allowed`,
    );
  }
  const failure = checkGuards(rule, context, donation, claim);
  if (failure) return failure;

  const nextDonation =
    to === "confirmed"
      ? {
          ...donation,
          available_servings: donation.available_servings - claim.servings,
        }
      : donation;
  const event = makeEvent(
    donation,
    claim,
    claim.status,
    to,
    context,
    to === "confirmed"
      ? { available_servings_after: nextDonation.available_servings }
      : {},
  );
  await appendEvent(event);
  return {
    ok: true,
    claim: { ...claim, status: to },
    donation: nextDonation,
    event,
  };
}
