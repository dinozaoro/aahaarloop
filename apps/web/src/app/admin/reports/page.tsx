import { ModerationQueue } from "@/components/moderation-queue";
import { requireAdmin } from "@/lib/auth/guards";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Moderation queue" };

export default async function ModerationPage() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Moderation queue</h1>
        <p className="text-sm text-muted-foreground">
          Review reports on donations and users. Resolve or dismiss each report;
          every decision is audited. AI authenticity signals appear here only.
        </p>
      </header>
      <ModerationQueue />
    </main>
  );
}
