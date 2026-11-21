import type { AiAnalysis } from "./types.ts";

export type Viewer = "admin" | "donor" | "public";

// Admins see the full analysis; everyone else gets a copy without the authenticity signal.
export function toViewerAnalysis(analysis: AiAnalysis, viewer: Viewer): AiAnalysis {
  if (viewer === "admin") return analysis;
  const copy: AiAnalysis = { ...analysis };
  delete copy.imageAuthenticity;
  return copy;
}
