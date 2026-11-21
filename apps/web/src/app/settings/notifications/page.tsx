import type { Metadata } from "next";
import { NotificationPreferencesForm } from "./notification-preferences-form";

export const metadata: Metadata = { title: "Notification preferences" };

export default function NotificationPreferencesPage() {
  return <NotificationPreferencesForm />;
}
