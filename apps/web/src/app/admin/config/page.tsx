import { AdminConfigForm } from "@/components/admin-config-form";
import { requireAdmin } from "@/lib/auth/guards";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Admin configuration" };

export default async function AdminConfigPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Configuration</h1>
        <p className="text-sm text-muted-foreground">
          City, donor segment, urgency thresholds, matching weights and safety
          buffer. Changes are validated, applied immediately and invalidate the
          match cache.
        </p>
      </header>
      <AdminConfigForm />
    </main>
  );
}
