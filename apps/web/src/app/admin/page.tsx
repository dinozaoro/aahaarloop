import { AdminTables } from "@/components/admin-tables";
import { requireAdmin } from "@/lib/auth/guards";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Admin dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Search and inspect users, organizations, donations, claims and missions.
          Every moderation action is written to the audit trail.
        </p>
      </header>
      <AdminTables />
    </main>
  );
}
