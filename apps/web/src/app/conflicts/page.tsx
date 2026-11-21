import type { Metadata } from "next";

import { ConflictList } from "@/components/conflict-list";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Sync conflicts" };

export default function ConflictsPage() {
  return (
    <WorkspaceShell>
      <div className="page-heading">
        <div>
          <p className="page-kicker">Offline sync</p>
          <h1>Review conflicts</h1>
          <p>Choose how to resolve changes made while you were offline.</p>
        </div>
      </div>
      <ConflictList />
    </WorkspaceShell>
  );
}
