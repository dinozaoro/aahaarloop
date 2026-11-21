import type { ClaimStatus, DonationStatus } from "@aahaarloop/shared";

export interface CachedDonation {
  id: string;
  title: string;
  status: DonationStatus;
  remainingQuantity: number;
  updatedAt: string;
  cachedAt: string;
}

export interface CachedClaim {
  id: string;
  donationId: string;
  status: ClaimStatus;
  quantity: number;
  updatedAt: string;
  cachedAt: string;
}

export interface CachedNeed {
  id: string;
  category: string;
  requiredServings: number;
  urgency: "low" | "medium" | "high" | "critical";
  updatedAt: string;
  cachedAt: string;
}

export interface DraftRecord {
  id: string;
  kind: "donation" | "claim" | "need";
  payload: unknown;
  updatedAt: string;
}

export interface SessionRecord {
  id: string;
  value: unknown;
  updatedAt: string;
}

export interface OfflineRecordMap {
  donations: CachedDonation;
  claims: CachedClaim;
  needs: CachedNeed;
  drafts: DraftRecord;
  sessions: SessionRecord;
}

export type StoreName = keyof OfflineRecordMap;
