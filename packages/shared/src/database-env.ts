import { z } from "zod";

const postgresUrl = z
  .string()
  .url()
  .refine((value) => /^postgres(ql)?:\/\//.test(value), {
    message: "must be a PostgreSQL connection string",
  });

export const databaseEnvSchema = z.object({
  /** Pooled connection string used by the running app. */
  DATABASE_URL: postgresUrl,
  /** Direct connection string used only by migrations. Optional locally. */
  DIRECT_URL: postgresUrl.optional(),
});

export type DatabaseEnv = z.output<typeof databaseEnvSchema>;
