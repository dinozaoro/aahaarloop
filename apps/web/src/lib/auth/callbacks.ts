/** Only allow same-origin relative redirects from user-supplied callback URLs. */
export function safeCallbackUrl(value: unknown, fallback: string): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}
