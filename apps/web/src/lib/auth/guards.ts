import { auth } from "@/auth";
import { redirect } from "next/navigation";

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
