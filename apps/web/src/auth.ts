import { sessionUserFromClaims } from "@/lib/auth/onboarding";
import { loadAuthIdentity, provisionGoogleUser } from "@/lib/auth/provision";
import { getDb } from "@/lib/db";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: { signIn: "/signin" },
  // Required behind preview/proxy hosts; see docs/authentication.md.
  trustHost: true,
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (account?.provider === "google" && user?.email) {
        const identity = await provisionGoogleUser(await getDb(), {
          email: user.email,
          name: user.name,
          image: user.image,
        });
        token.sub = identity.id;
        token.role = identity.role;
        token.activeOrganizationId = identity.activeOrganizationId;
      } else if (trigger === "update" || session?.user) {
        // Ignore client-supplied values; refresh claims from the database.
        if (token.sub) {
          const identity = await loadAuthIdentity(await getDb(), token.sub);
          token.role = identity.role;
          token.activeOrganizationId = identity.activeOrganizationId;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        const claims = sessionUserFromClaims({
          id: token.sub,
          role: token.role,
          activeOrganizationId: token.activeOrganizationId,
        });
        Object.assign(session.user, {
          ...claims,
          // No organization yet means onboarding has not been completed.
          needsOnboarding: claims.activeOrganizationId === null,
        });
      }
      return session;
    },
  },
});
