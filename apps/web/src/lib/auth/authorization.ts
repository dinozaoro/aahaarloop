import type { UserRole } from "./onboarding";

export interface AuthActor {
  id: string;
  role: UserRole;
  activeOrganizationId: string | null;
}

export function canAccessAdmin(actor: AuthActor): boolean {
  return actor.role === "admin";
}

export function isMemberOf(
  actor: AuthActor,
  organizationId: string | null | undefined,
): boolean {
  return (
    typeof organizationId === "string" &&
    actor.activeOrganizationId === organizationId
  );
}

/** Donors manage donations only in their own organization; admins override. */
export function canEditDonation(
  actor: AuthActor,
  donation: { organizationId: string },
): boolean {
  return (
    canAccessAdmin(actor) ||
    (actor.role === "donor" && isMemberOf(actor, donation.organizationId))
  );
}

/** A recipient may only claim for the organization they are acting as. */
export function canClaimFor(
  actor: AuthActor,
  recipientOrganizationId: string | null | undefined,
): boolean {
  return (
    actor.role === "recipient" && isMemberOf(actor, recipientOrganizationId)
  );
}

/** Volunteers may be assigned pickups but never reach admin surfaces. */
export function canBeAssignedPickup(actor: AuthActor): boolean {
  return actor.role === "volunteer" || canAccessAdmin(actor);
}
