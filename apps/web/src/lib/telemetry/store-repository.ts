import { createTelemetry, type TelemetryEvent } from "./events.ts";

/** Demo retention: at most 5,000 non-PII events, oldest dropped first. */
const MAX_EVENTS = 5_000;
const rows: TelemetryEvent[] = [];

export const telemetry = createTelemetry((event) => {
  rows.push(event);
  if (rows.length > MAX_EVENTS) rows.splice(0, rows.length - MAX_EVENTS);
});

export const telemetryEvents = rows;
