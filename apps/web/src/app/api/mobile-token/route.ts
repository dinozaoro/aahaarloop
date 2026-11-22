import { getSession } from "@/auth";
import { getDb } from "@/lib/db";
import { provisionGoogleUser } from "@/lib/auth/provision";
import { z } from "zod";

const mobileTokenSchema = z.object({
  purpose: z.literal("mobile-api"),
});

export async function GET(request: Request) {
  // Only accept requests from the mobile app's allowed origins
  const origin = request.headers.get("origin");
  const allowedOrigins = [
    "http://10.0.2.2:3000", // Android emulator
    "http://localhost:3000",
    "https://aahaarloop.vercel.app",
  ];

  if (origin && allowedOrigins.includes(origin)) {
    request.headers.set("origin", origin);
  }

  const session = await getSession();

  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Sign in required" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Provision/ensure the identity exists in the database
  const account = session.accounts?.[0];
  if (account?.provider === "google" && session.user?.email) {
    try {
      const identity = await provisionGoogleUser(await getDb(), {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      });
      // Update token with database identity
      const newSession = await (await import("next-auth")).getSession({
        ...session,
        user: { ...session.user, ...identity },
      });
      // Return the identity info
      return new Response(
        JSON.stringify({
          user: {
            id: newSession.user?.id,
            email: newSession.user?.email,
            name: newSession.user?.name,
            image: newSession.user?.image,
            role: newSession.user?.role,
            activeOrganizationId: newSession.user?.activeOrganizationId,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (err) {
      console.error("Provision error:", err);
    }
  }

  // Return basic user info
  return new Response(
    JSON.stringify({
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        role: session.user.role,
        activeOrganizationId: session.user.activeOrganizationId,
      },
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    },
  );
}