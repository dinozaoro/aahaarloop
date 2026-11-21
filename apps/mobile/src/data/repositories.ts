import {
  CLAIM_STATUSES,
  DONATION_STATUSES,
  STORAGE_TYPES,
  UNITS,
} from "@aahaarloop/shared";

import type { SqliteDatabase, SqlParam } from "./database-types.ts";
import {
  MISSION_STATUSES,
  type LocalClaim,
  type LocalDonation,
  type LocalMission,
} from "./types.ts";

function requireId(id: string, label: string): void {
  if (!id || !id.trim()) {
    throw new Error(`${label}: id is required`);
  }
}

function requireNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${label}: must be a non-negative number`);
  }
}

function requireTimestamp(value: string, label: string): void {
  if (!value || Number.isNaN(Date.parse(value))) {
    throw new Error(`${label}: expected an ISO timestamp`);
  }
}

function requireOneOf(
  value: string,
  allowed: readonly string[],
  label: string,
): void {
  if (!allowed.includes(value)) {
    throw new Error(`${label}: unsupported value "${value}"`);
  }
}

async function upsert(
  db: SqliteDatabase,
  table: string,
  columns: readonly string[],
  values: SqlParam[],
): Promise<void> {
  const placeholders = columns.map(() => "?").join(", ");
  const updates = columns
    .filter((column) => column !== "id")
    .map((column) => `${column} = excluded.${column}`)
    .join(", ");
  await db.runAsync(
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders}) ` +
      `ON CONFLICT(id) DO UPDATE SET ${updates}`,
    values,
  );
}

const DONATION_COLUMNS = [
  "id",
  "title",
  "description",
  "status",
  "quantity",
  "remaining_quantity",
  "unit",
  "storage",
  "address",
  "latitude",
  "longitude",
  "food_expiry_at",
  "best_before_at",
  "pickup_deadline_at",
  "updated_at",
] as const;

const DONATION_SELECT = `SELECT id, title, description, status, quantity,
  remaining_quantity AS remainingQuantity, unit, storage, address, latitude, longitude,
  food_expiry_at AS foodExpiryAt, best_before_at AS bestBeforeAt,
  pickup_deadline_at AS pickupDeadlineAt, updated_at AS updatedAt
  FROM donations`;

export class DonationRepository {
  private readonly db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.db = db;
  }

  async upsert(donation: LocalDonation): Promise<void> {
    requireId(donation.id, "donation");
    requireNonNegative(donation.quantity, "donation.quantity");
    requireNonNegative(
      donation.remainingQuantity,
      "donation.remainingQuantity",
    );
    requireOneOf(donation.status, DONATION_STATUSES, "donation.status");
    requireOneOf(donation.unit, UNITS, "donation.unit");
    requireOneOf(donation.storage, STORAGE_TYPES, "donation.storage");
    requireTimestamp(donation.updatedAt, "donation.updatedAt");

    await upsert(this.db, "donations", DONATION_COLUMNS, [
      donation.id,
      donation.title,
      donation.description,
      donation.status,
      donation.quantity,
      donation.remainingQuantity,
      donation.unit,
      donation.storage,
      donation.address,
      donation.latitude,
      donation.longitude,
      donation.foodExpiryAt,
      donation.bestBeforeAt,
      donation.pickupDeadlineAt,
      donation.updatedAt,
    ]);
  }

  getById(id: string): Promise<LocalDonation | null> {
    return this.db.getFirstAsync<LocalDonation>(
      `${DONATION_SELECT} WHERE id = ?`,
      [id],
    );
  }

  list(): Promise<LocalDonation[]> {
    return this.db.getAllAsync<LocalDonation>(
      `${DONATION_SELECT} ORDER BY updated_at DESC`,
      [],
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM donations WHERE id = ?", [id]);
  }
}

const CLAIM_COLUMNS = [
  "id",
  "donation_id",
  "recipient_id",
  "status",
  "quantity",
  "unit",
  "note",
  "expires_at",
  "created_at",
  "updated_at",
] as const;

const CLAIM_SELECT = `SELECT id, donation_id AS donationId,
  recipient_id AS recipientId, status, quantity, unit, note,
  expires_at AS expiresAt, created_at AS createdAt, updated_at AS updatedAt
  FROM claims`;

export class ClaimRepository {
  private readonly db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.db = db;
  }

  async upsert(claim: LocalClaim): Promise<void> {
    requireId(claim.id, "claim");
    requireId(claim.donationId, "claim.donationId");
    requireNonNegative(claim.quantity, "claim.quantity");
    requireOneOf(claim.status, CLAIM_STATUSES, "claim.status");
    requireOneOf(claim.unit, UNITS, "claim.unit");
    requireTimestamp(claim.createdAt, "claim.createdAt");
    requireTimestamp(claim.updatedAt, "claim.updatedAt");

    await upsert(this.db, "claims", CLAIM_COLUMNS, [
      claim.id,
      claim.donationId,
      claim.recipientId,
      claim.status,
      claim.quantity,
      claim.unit,
      claim.note,
      claim.expiresAt,
      claim.createdAt,
      claim.updatedAt,
    ]);
  }

  getById(id: string): Promise<LocalClaim | null> {
    return this.db.getFirstAsync<LocalClaim>(`${CLAIM_SELECT} WHERE id = ?`, [
      id,
    ]);
  }

  listByDonation(donationId: string): Promise<LocalClaim[]> {
    return this.db.getAllAsync<LocalClaim>(
      `${CLAIM_SELECT} WHERE donation_id = ? ORDER BY created_at DESC`,
      [donationId],
    );
  }

  list(): Promise<LocalClaim[]> {
    return this.db.getAllAsync<LocalClaim>(
      `${CLAIM_SELECT} ORDER BY created_at DESC`,
      [],
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM claims WHERE id = ?", [id]);
  }
}

const MISSION_COLUMNS = [
  "id",
  "donation_id",
  "claim_id",
  "status",
  "window_start",
  "window_end",
  "address",
  "latitude",
  "longitude",
  "capacity_kg",
  "notes",
  "updated_at",
] as const;

const MISSION_SELECT = `SELECT id, donation_id AS donationId, claim_id AS claimId,
  status, window_start AS windowStart, window_end AS windowEnd, address,
  latitude, longitude, capacity_kg AS capacityKg, notes, updated_at AS updatedAt
  FROM missions`;

export class MissionRepository {
  private readonly db: SqliteDatabase;

  constructor(db: SqliteDatabase) {
    this.db = db;
  }

  async upsert(mission: LocalMission): Promise<void> {
    requireId(mission.id, "mission");
    requireOneOf(mission.status, MISSION_STATUSES, "mission.status");
    if (mission.capacityKg != null) {
      requireNonNegative(mission.capacityKg, "mission.capacityKg");
    }
    requireTimestamp(mission.updatedAt, "mission.updatedAt");

    await upsert(this.db, "missions", MISSION_COLUMNS, [
      mission.id,
      mission.donationId,
      mission.claimId,
      mission.status,
      mission.windowStart,
      mission.windowEnd,
      mission.address,
      mission.latitude,
      mission.longitude,
      mission.capacityKg,
      mission.notes,
      mission.updatedAt,
    ]);
  }

  getById(id: string): Promise<LocalMission | null> {
    return this.db.getFirstAsync<LocalMission>(
      `${MISSION_SELECT} WHERE id = ?`,
      [id],
    );
  }

  listByStatus(status: LocalMission["status"]): Promise<LocalMission[]> {
    return this.db.getAllAsync<LocalMission>(
      `${MISSION_SELECT} WHERE status = ? ORDER BY window_start ASC`,
      [status],
    );
  }

  async remove(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM missions WHERE id = ?", [id]);
  }
}
