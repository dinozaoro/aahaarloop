import { defineConfig } from "drizzle-kit";

// `generate` is offline; the placeholder URL is only used by push/migrate/studio.
// Real connection strings come from DIRECT_URL or DATABASE_URL (see docs/development/environment.md).
export default defineConfig({
  schema: "./src/index.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL ??
      "postgresql://user:password@localhost:5432/aahaarloop",
  },
  strict: true,
  verbose: true,
});
