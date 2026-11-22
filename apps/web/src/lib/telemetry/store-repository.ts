import * as dal from "@/lib/data/dal";

import { createTelemetry } from "./events.ts";

export const telemetry = createTelemetry((event) => {
  // Telemetry must never delay or fail the request that emitted it.
  void dal.saveTelemetryEvent(event).catch(() => {});
});
