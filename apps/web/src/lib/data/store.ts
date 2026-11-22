import type { VolunteerProfile } from "@aahaarloop/matching";

import type { Claim, Donation, Need, Organization } from "@/lib/domain/types";

import * as dal from "./dal.ts";

/** Thin async façade kept so existing pages and repositories share one DAL. */
export function getAllDonations(): Promise<readonly Donation[]> {
  return dal.listDonations();
}

export function getDonation(id: string): Promise<Donation | undefined> {
  return dal.findDonation(id);
}

export async function getDonationsForOrganization(
  organizationId: string,
): Promise<readonly Donation[]> {
  return (await dal.listDonations()).filter(
    (donation) => donation.organizationId === organizationId,
  );
}

export function getClaims(): Promise<readonly Claim[]> {
  return dal.listClaims();
}

export function getClaim(id: string): Promise<Claim | undefined> {
  return dal.findClaim(id);
}

export async function getClaimsForDonation(donationId: string): Promise<readonly Claim[]> {
  return (await dal.listClaims()).filter((claim) => claim.donationId === donationId);
}

export async function getClaimsForOrganization(
  organizationId: string,
): Promise<readonly Claim[]> {
  return (await dal.listClaims()).filter(
    (claim) => claim.recipientOrgId === organizationId,
  );
}

export async function getClaimsForDonor(
  donorOrganizationId: string,
): Promise<readonly Claim[]> {
  const donationIds = new Set(
    (await getDonationsForOrganization(donorOrganizationId)).map(
      (donation) => donation.id,
    ),
  );
  return (await dal.listClaims()).filter((claim) => donationIds.has(claim.donationId));
}

export function getOrganization(id: string): Promise<Organization | undefined> {
  return dal.findOrganization(id);
}

export function getOrganizations(): Promise<readonly Organization[]> {
  return dal.listOrganizations();
}

export function getNeedsForOrganization(
  organizationId: string,
): Promise<readonly Need[]> {
  return dal.listNeeds(organizationId);
}

export function getVolunteerProfile(userId?: string): Promise<VolunteerProfile | undefined> {
  return userId ? dal.findVolunteerProfile(userId) : Promise.resolve(undefined);
}

export function upsertDonation(donation: Donation, actor = "system"): Promise<void> {
  return dal.saveDonation(donation, actor);
}

export function upsertClaim(claim: Claim, actor = "system"): Promise<void> {
  return dal.saveClaim(claim, actor);
}

export function findClaimByIdempotencyKey(key: string): Promise<Claim | undefined> {
  return dal.findClaimByIdempotencyKey(key);
}

export function upsertOrganization(organization: Organization): Promise<void> {
  return dal.saveOrganization(organization);
}
