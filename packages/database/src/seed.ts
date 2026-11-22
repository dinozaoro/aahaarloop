import {
  claimItems,
  claims,
  donationAllergens,
  donationItems,
  donations,
  favorites,
  foodAllergens,
  foodCategories,
  organizationMembers,
  organizations,
  pickupAssignments,
  pickupTasks,
  recipientNeeds,
  users,
} from "./index.ts";
import { buildSeedData } from "./seed-data.ts";

export interface SeedInsertResult {
  onConflictDoNothing(): PromiseLike<unknown>;
}

/** Minimal surface of a Drizzle database needed by the seed. */
export interface SeedInserter {
  insert(table: unknown): {
    values(values: readonly unknown[]): SeedInsertResult;
  };
}

export interface SeedStep {
  name: string;
  table: unknown;
  values: readonly unknown[];
}

/** Insert order respects foreign keys; conflict-safe inserts make it repeatable. */
export function buildSeedPlan(now: Date = new Date()): SeedStep[] {
  const data = buildSeedData(now);
  return [
    { name: "organizations", table: organizations, values: data.organizations },
    { name: "users", table: users, values: data.users },
    {
      name: "organizationMembers",
      table: organizationMembers,
      values: data.organizationMembers,
    },
    {
      name: "foodCategories",
      table: foodCategories,
      values: data.foodCategories,
    },
    { name: "foodAllergens", table: foodAllergens, values: data.foodAllergens },
    { name: "donations", table: donations, values: data.donations },
    { name: "donationItems", table: donationItems, values: data.donationItems },
    {
      name: "donationAllergens",
      table: donationAllergens,
      values: data.donationAllergens,
    },
    {
      name: "recipientNeeds",
      table: recipientNeeds,
      values: data.recipientNeeds,
    },
    { name: "claims", table: claims, values: data.claims },
    { name: "claimItems", table: claimItems, values: data.claimItems },
    { name: "pickupTasks", table: pickupTasks, values: data.pickupTasks },
    {
      name: "pickupAssignments",
      table: pickupAssignments,
      values: data.pickupAssignments,
    },
    { name: "favorites", table: favorites, values: data.favorites },
  ];
}

export async function seedDatabase(
  db: SeedInserter,
  now: Date = new Date(),
): Promise<void> {
  for (const step of buildSeedPlan(now)) {
    if (step.values.length === 0) continue;
    await db.insert(step.table).values(step.values).onConflictDoNothing();
  }
}
