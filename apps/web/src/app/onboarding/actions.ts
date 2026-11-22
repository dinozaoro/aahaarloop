"use server";

import {
  organizationMembers,
  organizations,
  users,
} from "@aahaarloop/database";

import { unstable_update } from "@/auth";
import { safeCallbackUrl } from "@/lib/auth/callbacks";
import { requireUser } from "@/lib/auth/guards";
import {
  isSelfAssignableRole,
  organizationTypeForRole,
  parseOrganizationMode,
  uniqueOrganizationSlug,
  validateJoinSlug,
  validateOrganizationName,
} from "@/lib/auth/onboarding";
import { getDb } from "@/lib/db";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";

function fail(code: string): never {
  redirect(`/onboarding?error=${code}`);
}

export async function completeOnboarding(formData: FormData) {
  const user = await requireUser();
  const roleValue = formData.get("role");
  if (!isSelfAssignableRole(roleValue)) fail("invalid-role");
  const role = roleValue;

  let mode: "create" | "join";
  try {
    mode = parseOrganizationMode(formData.get("orgMode"));
  } catch {
    fail("invalid-mode");
  }

  const db = await getDb();
  let organizationId: string;

  if (mode === "create") {
    let name: string;
    try {
      name = validateOrganizationName(formData.get("orgName"));
    } catch {
      fail("invalid-name");
    }
    const taken = (
      await db.select({ slug: organizations.slug }).from(organizations)
    ).map((row) => row.slug);
    const [created] = await db
      .insert(organizations)
      .values({
        name,
        slug: uniqueOrganizationSlug(name, taken),
        type: organizationTypeForRole(role),
      })
      .returning({ id: organizations.id });
    organizationId = created.id;
    await db
      .insert(organizationMembers)
      .values({ organizationId, userId: user.id, role: "owner" })
      .onConflictDoNothing();
  } else {
    let slug: string;
    try {
      slug = validateJoinSlug(formData.get("joinSlug"));
    } catch {
      fail("invalid-slug");
    }
    const [organization] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    if (!organization) fail("not-found");
    organizationId = organization.id;
    await db
      .insert(organizationMembers)
      .values({ organizationId, userId: user.id, role: "member" })
      .onConflictDoNothing();
  }

  await db
    .update(users)
    .set({
      role,
      activeOrganizationId: organizationId,
      updatedAt: new Date(),
      version: sql`${users.version} + 1`,
    })
    .where(eq(users.id, user.id));

  await unstable_update({
    user: { role, activeOrganizationId: organizationId },
  });
  redirect(safeCallbackUrl(formData.get("callbackUrl"), "/dashboard"));
}
