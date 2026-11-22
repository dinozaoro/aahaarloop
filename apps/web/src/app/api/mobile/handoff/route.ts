import { auth } from "@/auth";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// The only deep link allowed to receive a session cookie.
const APP_CALLBACK = "aahaarloop://auth";
const SESSION_COOKIES = ["authjs.session-token", "__Secure-authjs.session-token"];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? APP_CALLBACK;
  // This endpoint hands a session to a redirect target: never trust arbitrary URLs.
  if (returnTo !== APP_CALLBACK) {
    return NextResponse.json({ error: "Invalid returnTo" }, { status: 400 });
  }
  const callback = `${url.pathname}${url.search}`;

  const session = await auth();
  if (!session?.user?.id) {
    const entry = url.searchParams.get("mode") === "register" ? "/register" : "/signin";
    const signIn = new URL(entry, url.origin);
    signIn.searchParams.set("callbackUrl", callback);
    return NextResponse.redirect(signIn);
  }
  if (!session.user.activeOrganizationId) {
    const onboarding = new URL("/onboarding", url.origin);
    onboarding.searchParams.set("callbackUrl", callback);
    return NextResponse.redirect(onboarding);
  }

  const store = await cookies();
  const name = SESSION_COOKIES.find((candidate) => store.get(candidate)?.value);
  const value = name ? store.get(name)?.value : null;
  if (!value) return NextResponse.redirect(new URL("/signin", url.origin));

  const target = new URL(returnTo);
  target.searchParams.set("session", `${name}=${value}`);
  return NextResponse.redirect(target);
}
