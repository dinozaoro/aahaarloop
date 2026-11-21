"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  TRANSPORT_MODES,
  TRANSPORT_MODE_LABELS,
  editVolunteerProfile,
  getMatchingVolunteerFields,
  type TransportMode,
  type VolunteerProfile,
  type VolunteerProfileInput,
} from "@aahaarloop/matching";

import { Breadcrumbs, PageHeader } from "@/components/page-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getVolunteerProfile } from "@/lib/data/store";
import { formatDate, formatDateTime } from "@/lib/format";

const STORAGE_KEY = "aahaarloop.volunteer-profile";
const seedProfile = getVolunteerProfile();

interface WindowForm {
  start: string;
  end: string;
}

interface FormState {
  displayName: string;
  transportMode: TransportMode;
  capacity: string;
  radiusKm: string;
  latitude: string;
  longitude: string;
  windows: WindowForm[];
}

function toDateTimeInput(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formFromProfile(profile: VolunteerProfile): FormState {
  return {
    displayName: profile.displayName,
    transportMode: profile.transportMode,
    capacity: String(profile.transportCapacityKg),
    radiusKm: String(profile.serviceArea.radiusKm),
    latitude: String(profile.serviceArea.center.latitude),
    longitude: String(profile.serviceArea.center.longitude),
    windows: profile.availability.map((window) => ({
      start: toDateTimeInput(window.start as string),
      end: toDateTimeInput(window.end as string),
    })),
  };
}

function toProfileInput(form: FormState): VolunteerProfileInput {
  return {
    displayName: form.displayName,
    transportMode: form.transportMode,
    transportCapacityKg: Number(form.capacity),
    serviceArea: {
      center: {
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      },
      radiusKm: Number(form.radiusKm),
    },
    availability: form.windows.map((window) => ({
      start: new Date(window.start).toISOString(),
      end: new Date(window.end).toISOString(),
    })),
  };
}

function fieldError(errors: Record<string, string>, field: string): string {
  return errors[field] ?? "";
}

export default function VolunteerProfilePage() {
  const [profile, setProfile] = useState(seedProfile);
  const [form, setForm] = useState(() => formFromProfile(seedProfile));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw) as VolunteerProfile;
      if (saved?.id === seedProfile.id) {
        setProfile(saved);
        setForm(formFromProfile(saved));
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  function updateWindow(index: number, patch: Partial<WindowForm>) {
    setForm((current) => ({
      ...current,
      windows: current.windows.map((window, position) =>
        position === index ? { ...window, ...patch } : window,
      ),
    }));
  }

  function save() {
    const input = toProfileInput(form);
    const result = editVolunteerProfile(profile, input, new Date().toISOString());
    if (!result.profile) {
      setErrors(
        Object.fromEntries(result.errors.map((error) => [error.field, error.message])),
      );
      toast.error("Check the highlighted fields");
      return;
    }

    setProfile(result.profile);
    setErrors({});
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result.profile));
    toast.success("Profile saved");
  }

  function reset() {
    window.localStorage.removeItem(STORAGE_KEY);
    setProfile(seedProfile);
    setForm(formFromProfile(seedProfile));
    setErrors({});
    toast.success("Demo profile restored");
  }

  const matchingFields = getMatchingVolunteerFields(profile);
  const windowError = Object.entries(errors).find(([field]) =>
    field.startsWith("availability"),
  )?.[1];

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[{ label: "Volunteer" }, { label: "Profile" }]}
      />

      <PageHeader
        title="Volunteer profile"
        description="Set the transport, service area and windows used to decide which pickup missions you can accept."
        actions={
          <Badge variant={profile.verified ? "success" : "warning"}>
            {profile.verified ? "Verified" : "Unverified"}
          </Badge>
        }
      />

      <Card className="border-primary/30 bg-primary/5 shadow-none">
        <CardContent className="flex flex-wrap items-baseline gap-x-10 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-primary">
              {matchingFields.transportCapacityKg} kg
            </span>
            <span className="text-sm text-muted-foreground">
              capacity seen by matching
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-primary">
              {matchingFields.volunteerAvailability.length}
            </span>
            <span className="text-sm text-muted-foreground">
              availability windows
            </span>
          </div>
          <p className="w-full text-sm text-muted-foreground">
            Last saved {formatDate(new Date(profile.updatedAt).toISOString())}.
            Verification is set by
            the platform, not by this form.
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Transport and area</CardTitle>
            <CardDescription>
              Capacity limits the weight of a mission; the service radius limits
              how far you will travel for a pickup.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field data-invalid={Boolean(errors.displayName) || undefined}>
              <FieldLabel htmlFor="volunteer-name">Display name</FieldLabel>
              <Input
                id="volunteer-name"
                value={form.displayName}
                aria-invalid={Boolean(errors.displayName)}
                onChange={(event) =>
                  setForm({ ...form, displayName: event.target.value })
                }
              />
              <FieldError>{fieldError(errors, "displayName")}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="volunteer-mode">Transport mode</FieldLabel>
              <Select
                id="volunteer-mode"
                value={form.transportMode}
                onChange={(event) =>
                  setForm({
                    ...form,
                    transportMode: event.target.value as TransportMode,
                  })
                }
              >
                {TRANSPORT_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {TRANSPORT_MODE_LABELS[mode]}
                  </option>
                ))}
              </Select>
              <FieldError>{fieldError(errors, "transportMode")}</FieldError>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.transportCapacityKg) || undefined}>
                <FieldLabel htmlFor="volunteer-capacity">Capacity (kg)</FieldLabel>
                <Input
                  id="volunteer-capacity"
                  type="number"
                  min="1"
                  step="0.5"
                  value={form.capacity}
                  aria-invalid={Boolean(errors.transportCapacityKg)}
                  onChange={(event) =>
                    setForm({ ...form, capacity: event.target.value })
                  }
                />
                <FieldError>
                  {fieldError(errors, "transportCapacityKg")}
                </FieldError>
              </Field>

              <Field data-invalid={Boolean(errors["serviceArea.radiusKm"]) || undefined}>
                <FieldLabel htmlFor="volunteer-radius">Radius (km)</FieldLabel>
                <Input
                  id="volunteer-radius"
                  type="number"
                  min="1"
                  step="1"
                  value={form.radiusKm}
                  aria-invalid={Boolean(errors["serviceArea.radiusKm"])}
                  onChange={(event) =>
                    setForm({ ...form, radiusKm: event.target.value })
                  }
                />
                <FieldError>
                  {fieldError(errors, "serviceArea.radiusKm")}
                </FieldError>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                data-invalid={Boolean(errors["serviceArea.center.latitude"]) || undefined}
              >
                <FieldLabel htmlFor="volunteer-latitude">Centre latitude</FieldLabel>
                <Input
                  id="volunteer-latitude"
                  type="number"
                  step="0.0001"
                  value={form.latitude}
                  aria-invalid={Boolean(errors["serviceArea.center.latitude"])}
                  onChange={(event) =>
                    setForm({ ...form, latitude: event.target.value })
                  }
                />
                <FieldError>
                  {fieldError(errors, "serviceArea.center.latitude")}
                </FieldError>
              </Field>

              <Field
                data-invalid={Boolean(errors["serviceArea.center.longitude"]) || undefined}
              >
                <FieldLabel htmlFor="volunteer-longitude">
                  Centre longitude
                </FieldLabel>
                <Input
                  id="volunteer-longitude"
                  type="number"
                  step="0.0001"
                  value={form.longitude}
                  aria-invalid={Boolean(errors["serviceArea.center.longitude"])}
                  onChange={(event) =>
                    setForm({ ...form, longitude: event.target.value })
                  }
                />
                <FieldError>
                  {fieldError(errors, "serviceArea.center.longitude")}
                </FieldError>
              </Field>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>
              A mission is visible only when one window covers its whole pickup
              slot. Saved dates are shown in your local time.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {form.windows.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                No windows yet. You will not be offered missions until you add
                one.
              </p>
            ) : null}

            {form.windows.map((window, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 rounded-xl border border-border bg-card-hover p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Window {index + 1}</span>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove window ${index + 1}`}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        windows: current.windows.filter(
                          (_, position) => position !== index,
                        ),
                      }))
                    }
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor={`window-start-${index}`}>From</FieldLabel>
                    <Input
                      id={`window-start-${index}`}
                      type="datetime-local"
                      value={window.start}
                      onChange={(event) =>
                        updateWindow(index, { start: event.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor={`window-end-${index}`}>To</FieldLabel>
                    <Input
                      id={`window-end-${index}`}
                      type="datetime-local"
                      value={window.end}
                      onChange={(event) =>
                        updateWindow(index, { end: event.target.value })
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}

            <FieldError>{windowError ?? ""}</FieldError>

            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  windows: [...current.windows, { start: "", end: "" }],
                }))
              }
            >
              <Plus data-icon="inline-start" aria-hidden="true" />
              Add window
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button onClick={save}>Save profile</Button>
        <Button variant="ghost" onClick={reset}>
          Restore demo profile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saved windows</CardTitle>
          <CardDescription>The windows currently used for assignment.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {profile.availability.length === 0 ? (
            <p className="text-sm text-muted-foreground">No windows saved.</p>
          ) : (
            profile.availability.map((window, index) => (
              <Badge key={index} variant="secondary">
                {formatDateTime(window.start as string)} –{" "}
                {formatDateTime(window.end as string)}
              </Badge>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
