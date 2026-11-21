import { analyzeDonationImage, type AnalyzeDeps } from "./analyze.ts";
import type { AiAnalysis } from "./types.ts";

export interface PublishInput { donationId: string; imageUrl: string; }
export interface PublishDeps { publish: (donationId: string) => Promise<void>; analyze: AnalyzeDeps; }
export interface PublishResult { analysis: AiAnalysis; published: true; }

// Publishing is unconditional: it never depends on the analysis status.
// analyzeDonationImage never throws, so no fallback is needed here.
export async function publishDonation(input: PublishInput, deps: PublishDeps): Promise<PublishResult> {
  const analysis = await analyzeDonationImage(input, deps.analyze);
  await deps.publish(input.donationId);
  return { analysis, published: true };
}

