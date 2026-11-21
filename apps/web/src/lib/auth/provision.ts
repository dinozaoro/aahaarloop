import { organizationMembers, profiles, users } from "@aahaarloop/database";

import type { Db } from "@/lib/db";
import { eq } from "drizzle-orm";

import type { UserRole } from "./onboarding";

export interface GoogleProfile {
  email: string;
  name?: string | null;
  image?: string | null;
}

export interface AuthIdentity {
  id: string;
  role: UserRole;
  activeOrganizationId: string | null;
}

type StoredUser = typeof users.$inferSelect;

async function withOrganization(
  db: Db,
  user: StoredUser,
): Promise<AuthIdentity> {
  const membership = (
    await db
      .select({ organizationId: organizationMembers.organizationId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, user.id))
      .limit(1)
  )[0];

  return {
    id: user.id,
    role: user.role,
    activeOrganizationId:
      user.activeOrganizationId ?? membership?.organizationId ?? null,
  };
}

/** Finds or creates the local identity for a Google account. */
export async function provisionGoogleUser(
  db: Db,
  profile: GoogleProfile,
): Promise<AuthIdentity> {
  const email = profile.email.toLowerCase();
  let user = (
    await db.select().from(users).where(eq(users.email, email)).limit(1)
  )[0];

  if (!user) {
    // New users start with the safe non-admin role; onboarding sets the real one.
    const [inserted] = await db
      .insert(users)
      .values({
        email,
        name: profile.name?.trim() || email.split("@")[0],
        imageUrl: profile.image ?? null,
        role: "donor",
        emailVerifiedAt: new Date(),
      })
      .onConflictDoNothing()
      .returning();

    user =
      inserted ??
      (await db.select().from(users).where(eq(users.email, email)).limit(1))[0];
    if (!user) throw new Error("Could not provision the Google identity.");

    if (inserted) {
      await db
        .insert(profiles)
        .values({ userId: user.id })
        .onConflictDoNothing();
    }
  }

  return withOrganization(db, user);
}

/** Re-reads claims from the database instead of trusting session update data. */
export async function loadAuthIdentity(
  db: Db,
  userId: string,
): Promise<AuthIdentity> {
  const user = (
    await db.select().from(users).where(eq(users.id, userId)).limit(1)
  )[0];
  if (!user) throw new Error("Session user no longer exists.");
  return withOrganization(db, user);
}
