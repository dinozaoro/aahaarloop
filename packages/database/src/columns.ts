import { integer, timestamp, uuid } from "drizzle-orm/pg-core";

/** UUID primary key, creation/update timestamps and an optimistic-lock version. */
export const baseColumns = {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  version: integer("version").notNull().default(1),
};

/** Soft-delete marker: null means the row is active. */
export const softDeleteColumn = {
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};
