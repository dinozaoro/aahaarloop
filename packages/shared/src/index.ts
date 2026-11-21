export const MEAL_CATEGORIES = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
] as const;
export type MealCategory = (typeof MEAL_CATEGORIES)[number];

export { databaseEnvSchema, type DatabaseEnv } from "./database-env.ts";
export { parseEnv } from "./env.ts";
