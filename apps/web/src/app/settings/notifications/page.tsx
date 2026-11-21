"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NOTIFICATION_TYPES,
  type NotificationChannel,
  type NotificationPreferences,
  type NotificationType,
} from "@/lib/notifications/service";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Notification preferences" };

const TYPE_LABELS: Record<NotificationType, string> = {
  claim_created: "Claim submitted",
  claim_cancelled: "Claim cancelled",
  claim_expired: "Claim expired",
  pickup_assigned: "Pickup assigned",
  pickup_completed: "Pickup completed",
  delivered: "Delivery confirmed",
  deadline_approaching: "Deadline approaching",
};

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch("/api/notifications/preferences")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setPreferences(data);
      })
      .catch(() => undefined);
  }, []);

  async function save(next: NotificationPreferences) {
    const response = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(next),
    });
    if (response.ok) {
      setPreferences(await response.json());
      setSaved(true);
    }
  }

  if (!preferences) {
    return <main className="mx-auto max-w-2xl px-4 py-10">Loading preferences…</main>;
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Notification preferences</h1>
        <p className="text-sm text-muted-foreground">
          Choose how and when Aahaar Loop notifies you. In-app notifications are always stored.
        </p>
      </header>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-medium">Delivery channel</h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Delivery channel">
          {(["in_app", "email", "push"] as NotificationChannel[]).map((channel) => (
            <Button
              key={channel}
              variant={preferences.channel === channel ? "default" : "outline"}
              onClick={() => void save({ ...preferences, channel })}
            >
              {channel === "in_app" ? "In-app" : channel === "email" ? "Email" : "Push"}
            </Button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-medium">Events</h2>
        <ul className="divide-y divide-border">
          {NOTIFICATION_TYPES.map((type) => (
            <li key={type} className="flex items-center justify-between gap-4 py-3">
              <span className="text-sm">{TYPE_LABELS[type]}</span>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preferences.enabled[type]}
                  onChange={(event) =>
                    void save({
                      ...preferences,
                      enabled: { ...preferences.enabled, [type]: event.target.checked },
                    })
                  }
                />
                <span className="text-sm text-muted-foreground">Enabled</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {saved && <Badge variant="secondary">Preferences saved</Badge>}
    </main>
  );
}
