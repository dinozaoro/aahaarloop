import type { UserRole } from "@/lib/auth/onboarding";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      activeOrganizationId: string | null;
      needsOnboarding: boolean;
    } & DefaultSession["user"];
  }
}
