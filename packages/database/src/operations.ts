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
  uuid,
} from "drizzle-orm/pg-core";

import { claims } from "./claims.ts";
import { baseColumns } from "./columns.ts";
import { donations } from "./donations.ts";
import {
  conflictResolution,
  reportStatus,
  syncStatus,
  transitionActor,
} from "./enums.ts";
import { organizations, users } from "./identity.ts";

/** A queued offline mutation waiting to be replayed on the server. */
export const syncOperations = pgTable(
  "sync_operations",
  {
    ...baseColumns,
    deviceId: text("device_id").notNull(),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    operation: text("operation").notNull(),
    payload: jsonb("payload"),
    status: syncStatus("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    lastError: text("last_error"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("sync_operations_device_status_idx").on(table.deviceId, table.status),
    index("sync_operations_status_idx").on(table.status),
    check("sync_operations_attempts_non_negative", sql`${table.attempts} >= 0`),
  ],
);

/** A local/remote disagreement found while replaying a sync operation. */
export const syncConflicts = pgTable(
  "sync_conflicts",
  {
    ...baseColumns,
    operationId: uuid("operation_id")
      .notNull()
      .references(() => syncOperations.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    localVersion: jsonb("local_version"),
    remoteVersion: jsonb("remote_version"),
    resolution: conflictResolution("resolution").notNull().default("pending"),
    resolvedBy: uuid("resolved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [index("sync_conflicts_operation_idx").on(table.operationId)],
);

/** Stored output of an AI classification or suggestion for a donation. */
export const aiAnalysis = pgTable(
  "ai_analysis",
  {
    ...baseColumns,
    donationId: uuid("donation_id").references(() => donations.id, {
      onDelete: "cascade",
    }),
    kind: text("kind").notNull(),
    model: text("model").notNull(),
    inputHash: text("input_hash"),
    result: jsonb("result").notNull(),
    confidence: numeric("confidence", { precision: 5, scale: 4 }),
    reviewedBy: uuid("reviewed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    index("ai_analysis_donation_idx").on(table.donationId, table.createdAt),
  ],
);

/** A user-reported safety or content issue. */
export const reports = pgTable(
  "reports",
  {
    ...baseColumns,
    reporterId: uuid("reporter_id").references(() => users.id, {
      onDelete: "set null",
    }),
    donationId: uuid("donation_id").references(() => donations.id, {
      onDelete: "set null",
    }),
    claimId: uuid("claim_id").references(() => claims.id, {
      onDelete: "set null",
    }),
    targetType: text("target_type").notNull().default("donation"),
    targetId: uuid("target_id"),
    reason: text("reason").notNull(),
    details: text("details"),
    status: reportStatus("status").notNull().default("open"),
    aiAnalysis: jsonb("ai_analysis"),
    resolutionNote: text("resolution_note"),
    resolvedBy: uuid("resolved_by").references(() => users.id, {
      onDelete: "set null",
    }),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("reports_status_idx").on(table.status),
    index("reports_donation_idx").on(table.donationId),
    index("reports_target_idx").on(table.targetType, table.targetId),
  ],
);

/** Append-only record of who changed what, used for security review. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    ...baseColumns,
    actorType: transitionActor("actor_type").notNull(),
    actorId: text("actor_id"),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    before: jsonb("before"),
    after: jsonb("after"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_occurred_idx").on(table.occurredAt),
    index("audit_logs_actor_idx").on(table.actorId),
  ],
);

/** Aggregated environmental/social impact attributed to an organization. */
export const impactRecords = pgTable(
  "impact_records",
  {
    ...baseColumns,
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    donationId: uuid("donation_id").references(() => donations.id, {
      onDelete: "set null",
    }),
    claimId: uuid("claim_id").references(() => claims.id, {
      onDelete: "set null",
    }),
    metric: text("metric").notNull(),
    value: integer("value").notNull(),
    unit: text("unit"),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("impact_records_org_metric_idx").on(
      table.organizationId,
      table.metric,
    ),
    index("impact_records_recorded_idx").on(table.recordedAt),
    check("impact_records_value_non_negative", sql`${table.value} >= 0`),
  ],
);

/** Replayable POST response, shared by every worker. */
export const apiIdempotency = pgTable("api_idempotency", {
  key: text("key").primaryKey(),
  status: integer("status").notNull(),
  bodyText: text("body_text").notNull(),
  contentType: text("content_type"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Non-PII product events, deduplicated by event id. */
export const telemetryEvents = pgTable("telemetry_events", {
  eventId: text("event_id").primaryKey(),
  name: text("name").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  payload: jsonb("payload").notNull(),
});

/** Single-row document holding the admin-tunable matching configuration. */
export const adminConfig = pgTable("admin_config", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
