import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { provisionGoogleUser } from "@/lib/auth/provision";

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

  const session = await auth();

  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Sign in required" }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // The session already has the provisioned identity from auth.js callbacks
  // Return the user identity info
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