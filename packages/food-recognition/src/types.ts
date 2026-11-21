export type Category =
  | "breakfast"
  | "lunch"
  | "dinner"
  | "snack"
  | "produce"
  | "bakery"
  | "dairy"
  | "prepared"
  | "other";
export interface Suggestion {
  category: Category;
  name: string;
  confidence: number;
}
export interface ProviderResult {
  suggestions: Suggestion[];
  provider: string;
  model: string;
}
export type AnalysisStatus = "suggested" | "low_confidence" | "failed";
export interface Confirmation {
  acceptedIndex: number | null;
  category: Category;
  name: string;
  confirmedAt: string;
}
export interface AiAnalysis {
  id: string;
  donationId: string;
  status: AnalysisStatus;
  provider: string;
  model: string;
  suggestions: Suggestion[];
  source: "ai";
  confirmedByDonor: boolean;
  createdAt: string;
  confirmation: Confirmation | null;
}
