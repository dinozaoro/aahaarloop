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

export type SyncOperationStatus =
  "pending" | "in_progress" | "completed" | "failed";

export interface QueuedOperation {
  id: string;
  deviceId: string;
  entityType: string;
  entityId: string | null;
  operation: string;
  payload: unknown;
  status: SyncOperationStatus;
  attempts: number;
  lastError: string | null;
  createdAt: string;
  nextAttemptAt: string;
  completedAt: string | null;
}

export interface OfflineRecordMap {
  donations: CachedDonation;
  claims: CachedClaim;
  needs: CachedNeed;
  drafts: DraftRecord;
  sessions: SessionRecord;
  operations: QueuedOperation;
  conflicts: OfflineConflict;
}

export type ConflictResolution = "pending" | "merged" | "overwritten" | "cancelled";

export interface OfflineConflict {
  id: string;
  operationId: string;
  entityType: string;
  entityId: string | null;
  localVersion: unknown;
  remoteVersion: unknown;
  resolution: ConflictResolution;
  detectedAt: string;
  resolvedAt: string | null;
}

export type StoreName = keyof OfflineRecordMap;
