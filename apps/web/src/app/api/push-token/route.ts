import { auth } from "@/auth";
import { z } from "zod";

const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["ios", "android"]).default("android"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = pushTokenSchema.safeParse(body);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: "Invalid push token data" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const session = await auth();

    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Sign in required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Store the push token associated with the user's organization
    const { token, platform } = result.data;

    // In a real implementation, we'd save this to the database
    // For now, we just acknowledge receipt
    console.log(`Push token registered for user ${session.user.id}: ${token} (${platform})`);

    return new Response(
      JSON.stringify({ success: true, message: "Push token registered" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Push token registration error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}