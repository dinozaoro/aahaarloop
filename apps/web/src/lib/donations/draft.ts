import type { DonationDateValues } from "./dates.ts";
import type { FoodCategory } from "../domain/types.ts";

export const DONATION_DRAFT_KEY = "aahaarloop.donation-draft";

export interface DonationLocationValues {
  address: string;
  locality: string;
  latitude: number;
  longitude: number;
  contactName: string;
  contactPhone: string;
  pickupInstructions: string;
  splittable: boolean;
}

export interface DonationDraft {
  basics: {
    foodName: string;
    category: FoodCategory;
    servings: number;
    description: string;
  } | null;
  dates: DonationDateValues | null;
  location: DonationLocationValues | null;
  status: "draft" | "published";
  publishedAt: string | null;
}

export interface DraftStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const emptyDraft: DonationDraft = {
  basics: null,
  dates: null,
  location: null,
  status: "draft",
  publishedAt: null,
};

export function readDraft(storage: DraftStorage): DonationDraft {
  try {
    const raw = storage.getItem(DONATION_DRAFT_KEY);
    if (!raw) return emptyDraft;
    const parsed = JSON.parse(raw) as Partial<DonationDraft>;
    return {
      basics: parsed.basics ?? null,
      dates: parsed.dates ?? null,
      location: parsed.location ?? null,
      status: parsed.status === "published" ? "published" : "draft",
      publishedAt:
        typeof parsed.publishedAt === "string" ? parsed.publishedAt : null,
    };
  } catch {
    return emptyDraft;
  }
}

export function writeDraft(storage: DraftStorage, draft: DonationDraft): void {
  storage.setItem(DONATION_DRAFT_KEY, JSON.stringify(draft));
}
