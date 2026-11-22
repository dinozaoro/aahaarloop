import { auth } from "@/auth";

export async function GET() {
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