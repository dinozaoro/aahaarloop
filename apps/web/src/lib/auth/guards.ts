import { donations, organizationMembers } from "@aahaarloop/database";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import {
  canClaimFor,
  canEditDonation,
  isMemberOf,
  type AuthActor,
} from "./authorization";
import type { UserRole } from "./onboarding";

/** Redirects anonymous visitors to sign-in before rendering a protected page. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/signin");
  return session.user;
}

export async function requireRole(roles: readonly UserRole[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/dashboard");
  return user;
}

export async function requireAdmin() {
  return requireRole(["admin"]);
}

async function withVerifiedOrganization(
  user: Awaited<ReturnType<typeof requireUser>>,
  organizationId: string | null | undefined,
): Promise<AuthActor> {
  if (!organizationId) return { ...user, activeOrganizationId: null };
  const db = await getDb();
  const [membership] = await db
    .select({ id: organizationMembers.id })
    .from(organizationMembers)
    .where(
      and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationId, organizationId),
      ),
    )
    .limit(1);
  return {
    ...user,
    activeOrganizationId: membership ? organizationId : null,
  };
}

/** Verifies real membership before treating an organization as the active one. */
export async function requireOrgMember(organizationId: string) {
  const user = await requireUser();
  const actor = await withVerifiedOrganization(user, organizationId);
  if (actor.role !== "admin" && !isMemberOf(actor, organizationId)) {
    redirect("/dashboard");
  }
  return user;
}

/** Blocks cross-organization donation edits (IDOR). */
export async function requireOwnership(input: {
  donationId?: string;
  organizationId?: string;
}) {
  const user = await requireUser();
  let organizationId = input.organizationId ?? null;
  if (!organizationId && input.donationId) {
    const db = await getDb();
    const [donation] = await db
      .select({ organizationId: donations.organizationId })
      .from(donations)
      .where(eq(donations.id, input.donationId))
      .limit(1);
    organizationId = donation?.organizationId ?? null;
  }
  const actor = await withVerifiedOrganization(user, organizationId);
  if (!organizationId || !canEditDonation(actor, { organizationId })) {
    redirect("/dashboard");
  }
  return user;
}

/** Blocks a recipient from claiming for an organization they do not belong to. */
export async function requireClaimFor(recipientOrganizationId: string) {
  const user = await requireRole(["recipient"]);
  const actor = await withVerifiedOrganization(user, recipientOrganizationId);
  if (!canClaimFor(actor, recipientOrganizationId)) redirect("/dashboard");
  return user;
}

/**
 * API variant: returns a ready-to-return 401/403 response, or null to proceed.
 */
export async function forbidUnlessRole(
  roles: readonly UserRole[],
): Promise<Response | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!roles.includes(session.user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
