"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminConfig, AdminConfigPatch } from "@/lib/config/admin-config";

const WEIGHT_LABELS: Record<keyof AdminConfig["matchingWeights"], string> = {
  urgency: "Urgency",
  distance: "Distance",
  quantity: "Quantity",
  needs: "Needs",
  availability: "Availability",
  logistics: "Logistics",
};

export function AdminConfigForm() {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [patch, setPatch] = useState<AdminConfigPatch>({});
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/admin/config")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setConfig(data.config);
      })
      .catch(() => undefined);
  }, []);

  async function save() {
    const response = await fetch("/api/admin/config", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await response.json();
    if (response.ok) {
      setConfig(data.config);
      setPatch({});
      setMessage("Configuration saved and caches invalidated.");
    } else {
      setMessage(data.error ?? "Could not save configuration.");
    }
  }

  if (!config) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Loading configuration…</p>;
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="City">
          <Input
            value={patch.city ?? config.city}
            onChange={(event) => setPatch({ ...patch, city: event.target.value })}
          />
        </Field>
        <Field label="Donor segment">
          <Input
            value={patch.donorSegment ?? config.donorSegment}
            onChange={(event) => setPatch({ ...patch, donorSegment: event.target.value })}
          />
        </Field>
        <Field label="Safety buffer (minutes)">
          <Input
            type="number"
            min={0}
            value={patch.safetyBufferMinutes ?? config.safetyBufferMinutes}
            onChange={(event) =>
              setPatch({ ...patch, safetyBufferMinutes: Number(event.target.value) })
            }
          />
        </Field>
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-medium">Urgency thresholds (hours)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {(Object.keys(config.urgencyThresholds) as Array<keyof AdminConfig["urgencyThresholds"]>).map(
            (key) => (
              <Field key={key} label={key.replace("Hours", "")}>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={patch.urgencyThresholds?.[key] ?? config.urgencyThresholds[key]}
                  onChange={(event) =>
                    setPatch({
                      ...patch,
                      urgencyThresholds: {
                        ...patch.urgencyThresholds,
                        [key]: Number(event.target.value),
                      },
                    })
                  }
                />
              </Field>
            ),
          )}
        </div>
      </section>

      <section className="space-y-3 rounded-lg border border-border p-4">
        <h2 className="text-lg font-medium">Matching weights</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(config.matchingWeights) as Array<keyof AdminConfig["matchingWeights"]>).map(
            (key) => (
              <Field key={key} label={WEIGHT_LABELS[key]}>
                <Input
                  type="number"
                  min={0}
                  step="0.05"
                  value={patch.matchingWeights?.[key] ?? config.matchingWeights[key]}
                  onChange={(event) =>
                    setPatch({
                      ...patch,
                      matchingWeights: {
                        ...patch.matchingWeights,
                        [key]: Number(event.target.value),
                      },
                    })
                  }
                />
              </Field>
            ),
          )}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={() => void save()} disabled={Object.keys(patch).length === 0}>
          Save configuration
        </Button>
        {message && <Badge variant="secondary">{message}</Badge>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-sm">
      <span className="font-medium capitalize">{label}</span>
      {children}
    </label>
  );
}
