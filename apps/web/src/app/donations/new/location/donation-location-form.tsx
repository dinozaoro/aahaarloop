"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  readDraft,
  writeDraft,
  type DonationDraft,
} from "@/lib/donations/draft";
import {
  FRACTIONAL_EXPLANATION,
  publishDraft,
  searchBengaluruAddresses,
  validatePickupLocation,
  type BengaluruLocality,
} from "@/lib/donations/location";
import { formatDateTime } from "@/lib/format";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

type Errors = Record<string, string>;

export function DonationLocationForm() {
  const [draft, setDraft] = useState<DonationDraft | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<BengaluruLocality | null>(null);
  const [pinPlaced, setPinPlaced] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [publishErrors, setPublishErrors] = useState<Errors>({});

  useEffect(() => {
    // localStorage is browser-only; defer so hydration stays deterministic.
    queueMicrotask(() => setDraft(readDraft(sessionStorage)));
  }, []);

  const results = searchBengaluruAddresses(query);

  function chooseLocality(locality: BengaluruLocality) {
    setSelected(locality);
    setPinPlaced(false);
    setQuery(locality.name);
  }

  function savePickup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = validatePickupLocation({
      address: String(data.get("address") ?? ""),
      localityId: selected?.id ?? "",
      pinPlaced,
      contactName: String(data.get("contactName") ?? ""),
      contactPhone: String(data.get("contactPhone") ?? ""),
      pickupInstructions: String(data.get("pickupInstructions") ?? ""),
      splittable: data.get("splittable") === "on",
    });
    setErrors(result.errors);
    if (result.values) {
      const current = draft ?? readDraft(sessionStorage);
      const updated = { ...current, location: result.values };
      writeDraft(sessionStorage, updated);
      setDraft(updated);
      setPublishErrors({});
    }
  }

  function publish() {
    const current = draft ?? readDraft(sessionStorage);
    const result = publishDraft(current);
    setPublishErrors(result.errors);
    if (result.donation) {
      const updated: DonationDraft = {
        ...current,
        status: "published",
        publishedAt: result.donation.publishedAt,
      };
      writeDraft(sessionStorage, updated);
      setDraft(updated);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Pickup point</CardTitle>
          <CardDescription>
            Search Bengaluru localities, then place the pin on the selected
            point before saving.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePickup} className="flex flex-col gap-6">
            <Field>
              <FieldLabel htmlFor="address">Street address *</FieldLabel>
              <Input
                id="address"
                name="address"
                placeholder="12, 100 Feet Road"
                maxLength={160}
                required
              />
              <FieldError>{errors.address}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="locality-search">
                Locality search *
              </FieldLabel>
              <Input
                id="locality-search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSelected(null);
                  setPinPlaced(false);
                }}
                placeholder="Try Indiranagar, 560095 or Whitefield"
                autoComplete="off"
              />
              <FieldDescription>
                Address search uses a curated Bengaluru locality list; no
                external geocoding call is made.
              </FieldDescription>
              <FieldError>{errors.locality}</FieldError>
              {results.length > 0 ? (
                <ul className="flex flex-wrap gap-2" role="list">
                  {results.map((locality) => (
                    <li key={locality.id}>
                      <Button
                        type="button"
                        variant={
                          selected?.id === locality.id ? "secondary" : "outline"
                        }
                        size="sm"
                        onClick={() => chooseLocality(locality)}
                      >
                        {locality.name} · {locality.pinCode}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </Field>

            {selected ? (
              <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                <div className="text-sm">
                  <p className="font-medium">{selected.name}</p>
                  <p className="text-muted-foreground">
                    {selected.latitude.toFixed(4)},{" "}
                    {selected.longitude.toFixed(4)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant={pinPlaced ? "secondary" : "default"}
                  size="sm"
                  onClick={() => setPinPlaced(true)}
                >
                  {pinPlaced ? "Pin placed" : "Place map pin"}
                </Button>
                {pinPlaced ? <Badge variant="success">Ready</Badge> : null}
              </div>
            ) : null}
            <FieldError>{errors.pin}</FieldError>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor="contactName">Contact name *</FieldLabel>
                <Input id="contactName" name="contactName" required />
                <FieldError>{errors.contactName}</FieldError>
              </Field>
              <Field>
                <FieldLabel htmlFor="contactPhone">Contact phone *</FieldLabel>
                <Input
                  id="contactPhone"
                  name="contactPhone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  required
                />
                <FieldError>{errors.contactPhone}</FieldError>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="pickupInstructions">
                Pickup instructions
              </FieldLabel>
              <Textarea
                id="pickupInstructions"
                name="pickupInstructions"
                maxLength={300}
                placeholder="Gate, floor, who to ask for"
              />
              <FieldError>{errors.pickupInstructions}</FieldError>
            </Field>

            <label className="flex items-start gap-3">
              <Checkbox name="splittable" />
              <span className="text-sm">
                <span className="font-medium">Allow fractional claims</span>
                <span className="block text-muted-foreground">
                  {FRACTIONAL_EXPLANATION}
                </span>
              </span>
            </label>

            <Button type="submit">Save pickup details</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Review and publish</CardTitle>
          <CardDescription>
            Every field from steps 2 and 3 is shown before the donation becomes
            available.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {!draft?.location ? (
            <p className="text-sm text-muted-foreground">
              Save a pickup point to unlock review and publishing.
            </p>
          ) : (
            <>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium">Use-by</dt>
                  <dd>
                    {draft.dates
                      ? formatDateTime(draft.dates.foodExpiryAt)
                      : "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Best-before</dt>
                  <dd>
                    {draft.dates?.bestBeforeAt
                      ? formatDateTime(draft.dates.bestBeforeAt)
                      : "Not supplied"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Pickup deadline</dt>
                  <dd>
                    {draft.dates
                      ? formatDateTime(draft.dates.pickupDeadlineAt)
                      : "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Effective deadline</dt>
                  <dd>
                    {draft.dates
                      ? formatDateTime(draft.dates.effectiveDeadlineAt)
                      : "Not set"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Storage and packaging</dt>
                  <dd>
                    {draft.dates?.storage ?? "Not set"} ·{" "}
                    {draft.dates?.packaging || "no packaging notes"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Allergens</dt>
                  <dd>
                    {draft.dates?.allergens.join(", ") || "None declared"}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Dietary flags</dt>
                  <dd>{draft.dates?.dietTags.join(", ") || "None declared"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Pickup address</dt>
                  <dd>
                    {draft.location.address}, {draft.location.locality}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Map pin</dt>
                  <dd>
                    {draft.location.latitude.toFixed(4)},{" "}
                    {draft.location.longitude.toFixed(4)}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Contact</dt>
                  <dd>
                    {draft.location.contactName} · {draft.location.contactPhone}
                  </dd>
                </div>
                <div>
                  <dt className="font-medium">Instructions</dt>
                  <dd>{draft.location.pickupInstructions || "None"}</dd>
                </div>
                <div>
                  <dt className="font-medium">Fractional claims</dt>
                  <dd>
                    {draft.location.splittable ? "Allowed" : "Not allowed"}
                  </dd>
                </div>
              </dl>

              <FieldError>{publishErrors.dates}</FieldError>
              {!draft.dates ? (
                <Link href="/donations/new/dates" className="text-sm underline">
                  Complete step 2 first
                </Link>
              ) : null}

              {draft.status === "published" ? (
                <p role="status" className="flex items-center gap-2 text-sm">
                  <Badge variant="success">Available to recipients</Badge>
                  Published at{" "}
                  {draft.publishedAt
                    ? formatDateTime(draft.publishedAt)
                    : "just now"}
                  .
                </p>
              ) : (
                <Button type="button" onClick={publish}>
                  Publish donation
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
