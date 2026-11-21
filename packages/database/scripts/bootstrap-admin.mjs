import { databaseEnvSchema, parseEnv } from "@aahaarloop/shared";

import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

import { auditLogs, users } from "../src/index.ts";

// Privileged and hard to reverse: require two explicit confirmations.
if (process.env.ALLOW_ADMIN_BOOTSTRAP !== "true") {
  console.error("Refusing to bootstrap: set ALLOW_ADMIN_BOOTSTRAP=true.");
  process.exit(1);
}
const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
if (!email) {
  console.error("ADMIN_BOOTSTRAP_EMAIL is required.");
  process.exit(1);
}

const env = parseEnv(databaseEnvSchema, process.env);
const connectionString = env.DIRECT_URL ?? env.DATABASE_URL;
const client = new pg.Client({
  connectionString,
  connectionTimeoutMillis: 5000,
  ssl: connectionString.includes("sslmode=disable") ? false : true,
});

try {
  await client.connect();
  const db = drizzle(client);
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (!user) {
    console.error("No user has that email. Ask them to sign in first.");
    process.exitCode = 1;
  } else if (user.role === "admin") {
    console.log(`${email} is already an admin.`);
  } else {
    await db
      .update(users)
      .set({
        role: "admin",
        updatedAt: new Date(),
        version: sql`${users.version} + 1`,
      })
      .where(eq(users.id, user.id));
    await db.insert(auditLogs).values({
      actorType: "system",
      actorId: "bootstrap-admin-script",
      action: "admin.bootstrap",
      entityType: "users",
      entityId: user.id,
      after: { role: "admin", email },
    });
    console.log(
      `Granted admin to ${email}; recorded an admin.bootstrap audit entry.`,
    );
  }
} catch (error) {
  console.error(`Admin bootstrap failed (${error.code ?? "unknown error"}).`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
