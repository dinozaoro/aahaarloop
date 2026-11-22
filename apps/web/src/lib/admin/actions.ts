import { ApiError } from "../api/errors.ts";
import type { Claim, Donation, Organization } from "../domain/types.ts";

export type AdminAction = "unpublish_donation" | "verify_organization";

export interface AdminActionRepository {
  findDonation(id: string): Donation | undefined;
  saveDonation(donation: Donation): void;
  findOrganization(id: string): Organization | undefined;
  saveOrganization(organization: Organization): void;
  findClaim(id: string): Claim | undefined;
  audit(input: {
    action: string;
    entityType: string;
    entityId: string;
    actorId: string;
    after: unknown;
  }): void;
}

export interface AdminActionCommand {
  action: AdminAction;
  entityType: "donation" | "organization" | "claim";
  entityId: string;
  actorId: string;
}

/** Applies an audited moderation action. The caller must have checked admin role. */
export function applyAdminAction(
  repo: AdminActionRepository,
  command: AdminActionCommand,
) {
  if (command.action === "unpublish_donation") {
    if (command.entityType !== "donation") {
      throw new ApiError("validation_error", "Action requires a donation");
    }
    const donation = repo.findDonation(command.entityId);
    if (!donation) throw new ApiError("not_found", "Donation not found");
    const updated: Donation = { ...donation, status: "draft", updatedAt: new Date().toISOString() };
    repo.saveDonation(updated);
    repo.audit({
      action: "admin.donation.unpublish",
      entityType: "donation",
      entityId: donation.id,
      actorId: command.actorId,
      after: { status: "draft" },
    });
    return { id: donation.id, status: updated.status };
  }

  if (command.action === "verify_organization") {
    if (command.entityType !== "organization") {
      throw new ApiError("validation_error", "Action requires an organization");
    }
    const organization = repo.findOrganization(command.entityId);
    if (!organization) throw new ApiError("not_found", "Organization not found");
    const updated: Organization = { ...organization, verified: true };
    repo.saveOrganization(updated);
    repo.audit({
      action: "admin.organization.verify",
      entityType: "organization",
      entityId: organization.id,
      actorId: command.actorId,
      after: { verified: true },
    });
    return { id: organization.id, verified: true };
  }

  throw new ApiError("validation_error", "Unknown admin action");
}
