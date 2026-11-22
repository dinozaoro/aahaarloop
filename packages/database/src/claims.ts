import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { baseColumns } from "./columns.ts";
import { donationItems, donations } from "./donations.ts";
import {
  claimStatus,
  pickupTaskStatus,
  quantityUnit,
  transitionActor,
} from "./enums.ts";
import { organizations, users } from "./identity.ts";

/** A recipient organization's request to take part of a donation. */
export const claims = pgTable(
  "claims",
  {
    ...baseColumns,
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "restrict" }),
    recipientOrgId: uuid("recipient_org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    claimedByUserId: uuid("claimed_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: claimStatus("status").notNull().default("pending"),
    quantity: integer("quantity").notNull(),
    unit: quantityUnit("unit").notNull().default("servings"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: text("cancel_reason"),
    idempotencyKey: text("idempotency_key"),
  },
  (table) => [
    uniqueIndex("claims_idempotency_key_unique").on(table.idempotencyKey),
    index("claims_donation_status_idx").on(table.donationId, table.status),
    index("claims_recipient_status_idx").on(table.recipientOrgId, table.status),
    index("claims_status_expiry_idx").on(table.status, table.expiresAt),
    uniqueIndex("claims_active_donation_org_unique")
      .on(table.donationId, table.recipientOrgId)
      .where(sql`${table.status} not in ('cancelled', 'expired')`),
    check("claims_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);

/** Which donation items a claim takes, and how much of each. */
export const claimItems = pgTable(
  "claim_items",
  {
    ...baseColumns,
    claimId: uuid("claim_id")
      .notNull()
      .references(() => claims.id, { onDelete: "cascade" }),
    donationItemId: uuid("donation_item_id").references(
      () => donationItems.id,
      {
        onDelete: "set null",
      },
    ),
    quantity: integer("quantity").notNull(),
  },
  (table) => [
    index("claim_items_claim_idx").on(table.claimId),
    check("claim_items_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);

/** Logistics for collecting a claimed donation. */
export const pickupTasks = pgTable(
  "pickup_tasks",
  {
    ...baseColumns,
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    claimId: uuid("claim_id").references(() => claims.id, {
      onDelete: "set null",
    }),
    status: pickupTaskStatus("status").notNull().default("unassigned"),
    windowStart: timestamp("window_start", { withTimezone: true }),
    windowEnd: timestamp("window_end", { withTimezone: true }),
    address: text("address"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    capacityKg: integer("capacity_kg"),
    notes: text("notes"),
  },
  (table) => [
    index("pickup_tasks_donation_idx").on(table.donationId),
    index("pickup_tasks_status_window_idx").on(table.status, table.windowStart),
    check("pickup_tasks_capacity_non_negative", sql`${table.capacityKg} >= 0`),
  ],
);

/** A volunteer's assignment to a pickup task. */
export const pickupAssignments = pgTable(
  "pickup_assignments",
  {
    ...baseColumns,
    taskId: uuid("task_id")
      .notNull()
      .references(() => pickupTasks.id, { onDelete: "cascade" }),
    volunteerId: uuid("volunteer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: text("status").notNull().default("assigned"),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("pickup_assignments_task_volunteer_unique").on(
      table.taskId,
      table.volunteerId,
    ),
    index("pickup_assignments_volunteer_idx").on(table.volunteerId),
  ],
);

/** Immutable audit trail of every donation/claim lifecycle transition. */
export const donationEvents = pgTable(
  "donation_events",
  {
    ...baseColumns,
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    claimId: uuid("claim_id").references(() => claims.id, {
      onDelete: "set null",
    }),
    actorType: transitionActor("actor_type").notNull(),
    /** User id when actor_type is not "system"; string keeps system actors. */
    actorId: text("actor_id"),
    fromStatus: text("from_status"),
    toStatus: text("to_status").notNull(),
    reason: text("reason"),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("donation_events_donation_time_idx").on(
      table.donationId,
      table.occurredAt,
    ),
    index("donation_events_claim_idx").on(table.claimId),
  ],
);

/** A message delivered to a user about a donation, claim or pickup. */
export const notifications = pgTable(
  "notifications",
  {
    ...baseColumns,
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    data: jsonb("data"),
    readAt: timestamp("read_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => [
    index("notifications_user_read_idx").on(table.userId, table.readAt),
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
  ],
);
