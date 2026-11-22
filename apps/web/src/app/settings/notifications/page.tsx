import type { Metadata } from "next";
import Link from "next/link";

import { NotificationPreferencesForm } from "@/components/notification-preferences-form";
import { WorkspaceShell } from "@/components/workspace-shell";

export const metadata: Metadata = { title: "Notification preferences" };

export default function NotificationPreferencesPage() {
  return <WorkspaceShell><div className="settings-page">
    <div className="page-heading"><div><p className="page-kicker">Settings</p><h1>Notification preferences.</h1><p><Link href="/settings">Back to settings</Link></p></div></div>
    <NotificationPreferencesForm />
  </div></WorkspaceShell>;
}
