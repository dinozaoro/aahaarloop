const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /\+?\d[\d\s().-]{7,}\d/g;
const SECRET = /(nt_live_[A-Za-z0-9_-]+|sk-[A-Za-z0-9_-]{8,})/g;

/** Removes identifiers and credentials before a string reaches a log sink. */
export function redact(value: string): string {
  return value
    .replace(EMAIL, "[email]")
    .replace(PHONE, "[phone]")
    .replace(SECRET, "[token]");
}

export function logStructured(
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const safe = Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      typeof value === "string" ? redact(value) : value,
    ]),
  );
  console.info(
    JSON.stringify({ event, at: new Date().toISOString(), ...safe }),
  );
}
