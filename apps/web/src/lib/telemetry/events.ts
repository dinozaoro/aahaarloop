export const TELEMETRY_EVENTS = [
  "donation_created",
  "donation_claimed",
  "donation_matched",
  "donation_delivered",
] as const;
export type TelemetryEventName = (typeof TELEMETRY_EVENTS)[number];

export type TelemetryValue = string | number | boolean;
export interface TelemetryEvent {
  eventId: string;
  name: TelemetryEventName;
  occurredAt: string;
  payload: Record<string, TelemetryValue>;
}

/** Only these fields are ever recorded. Everything else is dropped. */
export const PAYLOAD_KEYS: Record<TelemetryEventName, readonly string[]> = {
  donation_created: ["category", "servings", "storage", "hasPhoto"],
  donation_claimed: ["servings", "isPartial"],
  donation_matched: ["matchCount", "excludedCount", "topScore"],
  donation_delivered: ["servings", "weightKg"],
};

const EMAIL_OR_PHONE = /@|^\+?[\d\s().-]{7,}$/;

export function sanitizePayload(
  name: TelemetryEventName,
  input: Record<string, unknown>,
): Record<string, TelemetryValue> {
  const allowed = new Set(PAYLOAD_KEYS[name]);
  const output: Record<string, TelemetryValue> = {};
  for (const [key, value] of Object.entries(input)) {
    if (!allowed.has(key)) continue;
    if (typeof value === "string") {
      if (EMAIL_OR_PHONE.test(value)) continue;
      output[key] = value.slice(0, 60);
    } else if (typeof value === "number" && Number.isFinite(value)) {
      output[key] = value;
    } else if (typeof value === "boolean") {
      output[key] = value;
    }
    // Objects, arrays, null and undefined are never recorded.
  }
  return output;
}

/** Stable 32-bit hash so a given event id is sampled the same way everywhere. */
function hash(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export type TelemetrySink = (event: TelemetryEvent) => void | Promise<void>;

export interface TelemetryOptions {
  sampleRate?: number;
  now?: () => string;
}

export function createTelemetry(sink: TelemetrySink, options: TelemetryOptions = {}) {
  const sampleRate = options.sampleRate ?? 1;
  if (!Number.isFinite(sampleRate) || sampleRate < 0 || sampleRate > 1) {
    throw new TypeError("sampleRate must be between 0 and 1");
  }
  const now = options.now ?? (() => new Date().toISOString());
  const seen = new Set<string>();

  return {
    async track(
      name: TelemetryEventName,
      payload: Record<string, unknown>,
      meta: { eventId?: string; occurredAt?: string } = {},
    ): Promise<boolean> {
      const eventId = meta.eventId ?? crypto.randomUUID();
      if (seen.has(eventId)) return false;
      seen.add(eventId);
      if (sampleRate < 1 && hash(eventId) % 10_000 >= sampleRate * 10_000) {
        return false;
      }
      const event: TelemetryEvent = {
        eventId,
        name,
        occurredAt: meta.occurredAt ?? now(),
        payload: sanitizePayload(name, payload),
      };
      await sink(event);
      return true;
    },
  };
}
