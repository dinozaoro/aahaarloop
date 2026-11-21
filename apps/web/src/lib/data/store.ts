import type { VolunteerProfile } from "@aahaarloop/matching";

import type { Claim, Donation, Need, Organization } from "@/lib/domain/types";

import { createSeedData } from "./seed";

// Demo persistence: module-level state in the Next.js server process. Every
// mutation issue replaces this with the database layer; until then the data
// resets when the server restarts, which the UI states explicitly.
const seed = createSeedData();

const donations: Donation[] = seed.donations;
const claims: Claim[] = seed.claims;
const needs: Need[] = seed.needs;
const organizations: Organization[] = seed.organizations;

export function getAllDonations(): readonly Donation[] {
  return donations;
}

export function getDonation(id: string): Donation | undefined {
  return donations.find((donation) => donation.id === id);
}

export function getDonationsForOrganization(
  organizationId: string,
): readonly Donation[] {
  return donations.filter(
    (donation) => donation.organizationId === organizationId,
  );
}

export function getClaims(): readonly Claim[] {
  return claims;
}

export function getClaim(id: string): Claim | undefined {
  return claims.find((claim) => claim.id === id);
}

export function getClaimsForDonation(donationId: string): readonly Claim[] {
  return claims.filter((claim) => claim.donationId === donationId);
}

export function getClaimsForOrganization(
  organizationId: string,
): readonly Claim[] {
  return claims.filter((claim) => claim.recipientOrgId === organizationId);
}

export function getClaimsForDonor(
  donorOrganizationId: string,
): readonly Claim[] {
  const donationIds = new Set(
    getDonationsForOrganization(donorOrganizationId).map(
      (donation) => donation.id,
    ),
  );
  return claims.filter((claim) => donationIds.has(claim.donationId));
}

export function getOrganization(id: string): Organization | undefined {
  return organizations.find((organization) => organization.id === id);
}

export function getOrganizations(): readonly Organization[] {
  return organizations;
}

export function getNeedsForOrganization(
  organizationId: string,
): readonly Need[] {
  return needs.filter((need) => need.organizationId === organizationId);
}

export function getVolunteerProfile(): VolunteerProfile {
  return seed.volunteerProfile;
}

/** Demo write path: replaces the matching in-memory entry, or appends it. */
export function upsertDonation(donation: Donation): void {
  const index = donations.findIndex((item) => item.id === donation.id);
  if (index === -1) donations.push(donation);
  else donations[index] = donation;
}

export function upsertClaim(claim: Claim): void {
  const index = claims.findIndex((item) => item.id === claim.id);
  if (index === -1) claims.push(claim);
  else claims[index] = claim;
}

export function findClaimByIdempotencyKey(key: string): Claim | undefined {
  return claims.find((claim) => claim.idempotencyKey === key);
}

export function upsertOrganization(organization: Organization): void {
  const index = organizations.findIndex((item) => item.id === organization.id);
  if (index === -1) organizations.push(organization);
  else organizations[index] = organization;
}

