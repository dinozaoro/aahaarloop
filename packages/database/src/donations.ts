import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { baseColumns, softDeleteColumn } from "./columns.ts";
import { donationStatus, quantityUnit, storageType } from "./enums.ts";
import { organizations, users } from "./identity.ts";

/** A top-level food category; categories may be nested via parent_id. */
export const foodCategories = pgTable(
  "food_categories",
  {
    ...baseColumns,
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    parentId: uuid("parent_id"),
    icon: text("icon"),
    description: text("description"),
  },
  (table) => [
    uniqueIndex("food_categories_slug_unique").on(table.slug),
    index("food_categories_parent_idx").on(table.parentId),
  ],
);

/** A known allergen used to warn recipients (e.g. peanut, gluten). */
export const foodAllergens = pgTable("food_allergens", {
  ...baseColumns,
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
});

/** One surplus-food offer owned by a donor organization. */
export const donations = pgTable(
  "donations",
  {
    ...baseColumns,
    ...softDeleteColumn,
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    description: text("description"),
    categoryId: uuid("category_id").references(() => foodCategories.id, {
      onDelete: "set null",
    }),
    status: donationStatus("status").notNull().default("draft"),
    /** DLC, use-by date: hard food-safety deadline. */
    foodExpiryAt: timestamp("food_expiry_at", { withTimezone: true }),
    /** DDM, best-before date: quality hint, never a hard deadline. */
    bestBeforeAt: timestamp("best_before_at", { withTimezone: true }),
    /** Operational pickup cutoff. */
    pickupDeadlineAt: timestamp("pickup_deadline_at", { withTimezone: true }),
    /** Cached min(foodExpiryAt, pickupDeadlineAt) across items. */
    effectiveDeadlineAt: timestamp("effective_deadline_at", {
      withTimezone: true,
    }),
    quantity: integer("quantity").notNull(),
    remainingQuantity: integer("remaining_quantity").notNull(),
    quantityUnit: quantityUnit("quantity_unit").notNull().default("servings"),
    storage: storageType("storage").notNull(),
    packaging: text("packaging"),
    address: text("address"),
    latitude: numeric("latitude", { precision: 10, scale: 7 }),
    longitude: numeric("longitude", { precision: 10, scale: 7 }),
    contactName: text("contact_name"),
    contactPhone: text("contact_phone"),
    pickupInstructions: text("pickup_instructions"),
    splittable: boolean("splittable").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
  },
  (table) => [
    index("donations_status_expiry_idx").on(table.status, table.foodExpiryAt),
    index("donations_status_deadline_idx").on(
      table.status,
      table.pickupDeadlineAt,
    ),
    index("donations_organization_idx").on(table.organizationId),
    index("donations_category_idx").on(table.categoryId),
    index("donations_location_idx").on(table.latitude, table.longitude),
    check("donations_quantity_non_negative", sql`${table.quantity} >= 0`),
    check(
      "donations_remaining_non_negative",
      sql`${table.remainingQuantity} >= 0`,
    ),
    check(
      "donations_remaining_lte_quantity",
      sql`${table.remainingQuantity} <= ${table.quantity}`,
    ),
  ],
);

/** A distinct food line inside a donation, each with its own dates. */
export const donationItems = pgTable(
  "donation_items",
  {
    ...baseColumns,
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    categoryId: uuid("category_id").references(() => foodCategories.id, {
      onDelete: "set null",
    }),
    quantity: integer("quantity").notNull(),
    unit: quantityUnit("unit").notNull().default("servings"),
    foodExpiryAt: timestamp("food_expiry_at", { withTimezone: true }),
    bestBeforeAt: timestamp("best_before_at", { withTimezone: true }),
    storage: storageType("storage").notNull().default("ambient"),
    notes: text("notes"),
  },
  (table) => [
    index("donation_items_donation_idx").on(table.donationId),
    check("donation_items_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);

/** An uploaded image with its storage provider identifier. */
export const donationImages = pgTable(
  "donation_images",
  {
    ...baseColumns,
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    providerPublicId: text("provider_public_id"),
    altText: text("alt_text"),
    position: integer("position").notNull().default(0),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
  },
  (table) => [
    index("donation_images_donation_idx").on(table.donationId),
    check("donation_images_position_non_negative", sql`${table.position} >= 0`),
  ],
);

/** Join table linking a donation to the allergens its items contain. */
export const donationAllergens = pgTable(
  "donation_allergens",
  {
    ...baseColumns,
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    allergenId: uuid("allergen_id")
      .notNull()
      .references(() => foodAllergens.id, { onDelete: "restrict" }),
  },
  (table) => [
    uniqueIndex("donation_allergens_unique").on(
      table.donationId,
      table.allergenId,
    ),
  ],
);

/** A recipient's saved donation for quick access. */
export const favorites = pgTable(
  "favorites",
  {
    ...baseColumns,
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    donationId: uuid("donation_id")
      .notNull()
      .references(() => donations.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id").references(() => organizations.id, {
      onDelete: "cascade",
    }),
  },
  (table) => [
    uniqueIndex("favorites_user_donation_unique").on(
      table.userId,
      table.donationId,
    ),
    index("favorites_user_org_idx").on(table.userId, table.organizationId),
  ],
);

/** A recipient organization's standing request for a category of food. */
export const recipientNeeds = pgTable(
  "recipient_needs",
  {
    ...baseColumns,
    ...softDeleteColumn,
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id").references(() => foodCategories.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    quantity: integer("quantity").notNull(),
    unit: quantityUnit("unit").notNull().default("servings"),
    neededBy: timestamp("needed_by", { withTimezone: true }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    notes: text("notes"),
  },
  (table) => [
    index("recipient_needs_org_idx").on(table.organizationId),
    index("recipient_needs_category_idx").on(table.categoryId),
    check("recipient_needs_quantity_non_negative", sql`${table.quantity} >= 0`),
  ],
);
