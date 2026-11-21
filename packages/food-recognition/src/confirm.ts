import type { AiAnalysis, Category, Confirmation } from "./types.ts";

export class ConfirmationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfirmationError";
  }
}

export type ConfirmDecision = { acceptedIndex: number } | { edited: { category: Category; name: string } };

export function confirmSuggestion(
  analysis: AiAnalysis,
  decision: ConfirmDecision,
  now: () => Date = () => new Date(),
): AiAnalysis {
  if (analysis.status === "failed") throw new ConfirmationError("cannot confirm a failed analysis");
  const confirmedAt = now().toISOString();

  let confirmation: Confirmation;
  if ("acceptedIndex" in decision) {
    const idx = decision.acceptedIndex;
    if (!Number.isInteger(idx) || idx < 0 || idx >= analysis.suggestions.length) {
      throw new ConfirmationError("suggestion index out of range");
    }
    const s = analysis.suggestions[idx];
    if (!s) throw new ConfirmationError("suggestion index out of range");
    confirmation = { acceptedIndex: idx, category: s.category, name: s.name, confirmedAt };
  } else {
    const name = decision.edited.name.trim();
    if (name === "") throw new ConfirmationError("name must not be empty");
    confirmation = { acceptedIndex: null, category: decision.edited.category, name, confirmedAt };
  }

  return { ...analysis, confirmedByDonor: true, confirmation };
}

export function isSaveable(analysis: AiAnalysis): boolean {
  return analysis.confirmedByDonor && analysis.confirmation !== null;
}

