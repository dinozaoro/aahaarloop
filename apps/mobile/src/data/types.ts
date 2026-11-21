import type {
  ClaimStatus,
  DonationStatus,
  StorageType,
  Unit,
} from "@aahaarloop/shared";

// Mirrors pickupTaskStatus in packages/database/src/enums.ts until that enum
// is exported from @aahaarloop/shared.
export const MISSION_STATUSES = [
  "unassigned",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
] as const;
export type MissionStatus = (typeof MISSION_STATUSES)[number];

export interface LocalDonation {
  id: string;
  title: string;
  description: string | null;
  status: DonationStatus;
  quantity: number;
  remainingQuantity: number;
  unit: Unit;
  storage: StorageType;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  foodExpiryAt: string | null;
  bestBeforeAt: string | null;
  pickupDeadlineAt: string | null;
  updatedAt: string;
}

export interface LocalClaim {
  id: string;
  donationId: string;
  recipientId: string;
  status: ClaimStatus;
  quantity: number;
  unit: Unit;
  note: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocalMission {
  id: string;
  donationId: string | null;
  claimId: string | null;
  status: MissionStatus;
  windowStart: string | null;
  windowEnd: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  capacityKg: number | null;
  notes: string | null;
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

export type ConflictResolution =
  "pending" | "merged" | "overwritten" | "cancelled";

export interface LocalConflict {
  id: string;
  operationId: string;
  entityType: string;
  entityId: string | null;
  localVersion: string;
  remoteVersion: string;
  resolution: ConflictResolution;
  resolvedAt: string | null;
}

export interface VersionedRecord {
  version: number;
  updatedAt: string;
}
