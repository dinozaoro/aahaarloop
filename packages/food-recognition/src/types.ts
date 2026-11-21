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
export interface ImageAuthenticitySignal { provider: "sightengine"; score: number; signals: Record<string, number>; }
export type ImageAuthenticityStatus = "clean" | "suspicious" | "unavailable";
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
  imageAuthenticity?: { status: ImageAuthenticityStatus; signal: ImageAuthenticitySignal | null };
}
