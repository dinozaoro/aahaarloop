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

import { baseColumns, softDeleteColumn } from "./columns.ts";
import { devicePlatform, organizationRole, userRole } from "./enums.ts";

/** A person who signs in. The role is chosen during onboarding. */
export const users = pgTable(
  "users",
  {
    ...baseColumns,
    ...softDeleteColumn,
    email: text("email").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    name: text("name").notNull(),
    imageUrl: text("image_url"),
    role: userRole("role").notNull(),
    activeOrganizationId: uuid("active_organization_id").references(
      () => organizations.id,
      { onDelete: "set null" },
    ),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_active_org_idx").on(table.activeOrganizationId),
  ],
);

/** Per-user notification channel and enabled types. */
export const notificationPreferences = pgTable("notification_preferences", {
  ...baseColumns,
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  channel: text("channel").notNull().default("in_app"),
  enabled: jsonb("enabled").$type<Record<string, boolean>>().notNull(),
});

/** Additional human-facing details that are not part of authentication. */
export const profiles = pgTable("profiles", {
  ...baseColumns,
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  phone: text("phone"),
  locale: text("locale").notNull().default("en-IN"),
  timezone: text("timezone").notNull().default("Asia/Kolkata"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
});

/** A donor kitchen, recipient shelter or volunteer group. */
export const organizations = pgTable(
  "organizations",
  {
    ...baseColumns,
    ...softDeleteColumn,
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    type: text("type").notNull(),
    description: text("description"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("organizations_slug_unique").on(table.slug),
    index("organizations_location_idx").on(table.latitude, table.longitude),
  ],
);

/** Membership link with a per-organization role. Unique per (org, user). */
export const organizationMembers = pgTable(
  "organization_members",
  {
    ...baseColumns,
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: organizationRole("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("organization_members_org_user_unique").on(
      table.organizationId,
      table.userId,
    ),
    index("organization_members_user_idx").on(table.userId),
  ],
);

/** Donor preferences: what they cook and when pickup usually works. */
export const donorProfiles = pgTable("donor_profiles", {
  ...baseColumns,
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  foodTypes: text("food_types").array(),
  pickupWindow: text("pickup_window"),
  notes: text("notes"),
});

/** Recipient constraints used by matching: needs, distance and transport. */
export const recipientProfiles = pgTable(
  "recipient_profiles",
  {
    ...baseColumns,
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    householdSize: integer("household_size").notNull().default(1),
    dietaryRestrictions: text("dietary_restrictions").array(),
    preferredCategories: text("preferred_categories").array(),
    maxDistanceKm: integer("max_distance_km"),
    transportCapacityKg: integer("transport_capacity_kg"),
  },
  (table) => [
    check("recipient_household_non_negative", sql`${table.householdSize} >= 0`),
    check(
      "recipient_max_distance_non_negative",
      sql`${table.maxDistanceKm} >= 0`,
    ),
    check(
      "recipient_transport_non_negative",
      sql`${table.transportCapacityKg} >= 0`,
    ),
  ],
);

/** Volunteer capabilities used when assigning pickup tasks. */
export const volunteerProfiles = pgTable(
  "volunteer_profiles",
  {
    ...baseColumns,
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "set null",
    }),
    vehicleType: text("vehicle_type"),
    capacityKg: integer("capacity_kg"),
    availability: text("availability").array(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (table) => [
    check("volunteer_capacity_non_negative", sql`${table.capacityKg} >= 0`),
  ],
);

/** A device registered for offline sync and push notifications. */
export const deviceSessions = pgTable(
  "device_sessions",
  {
    ...baseColumns,
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platform: devicePlatform("platform").notNull(),
    deviceId: text("device_id").notNull(),
    pushToken: text("push_token"),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("device_sessions_user_device_unique").on(
      table.userId,
      table.deviceId,
    ),
  ],
);
