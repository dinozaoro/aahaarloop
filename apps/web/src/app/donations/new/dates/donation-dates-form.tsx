"use client";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { Select } from "@/components/ui/select";
import {
  ALLERGEN_OPTIONS,
  LOCAL_TIME_ZONE,
  DIETARY_OPTIONS,
  STORAGE_OPTIONS,
  validateDonationDates,
  type DonationDateResult,
} from "@/lib/donations/dates";
import { readDraft, writeDraft } from "@/lib/donations/draft";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, type FormEvent } from "react";

const labelFor = (value: string) => value.replace(/-/g, " ");

export function DonationDatesForm() {
  const [result, setResult] = useState<DonationDateResult | null>(null);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = validateDonationDates({
      foodExpiryAt: String(data.get("foodExpiryAt") ?? ""),
      bestBeforeAt: String(data.get("bestBeforeAt") ?? ""),
      pickupDeadlineAt: String(data.get("pickupDeadlineAt") ?? ""),
      timeZone: LOCAL_TIME_ZONE,
      storage: String(data.get("storage") ?? ""),
      packaging: String(data.get("packaging") ?? ""),
      allergens: data.getAll("allergens").map(String),
      dietTags: data.getAll("dietTags").map(String),
    });
    if (next.values) {
      const draft = readDraft(sessionStorage);
      writeDraft(sessionStorage, {
        ...draft,
        dates: next.values,
        status: "draft",
        publishedAt: null,
      });
    }
    setResult(next);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Three different dates</CardTitle>
            <CardDescription>
              Enter times in {LOCAL_TIME_ZONE}; they are stored as UTC
              timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="foodExpiryAt">Use-by (DLC) *</FieldLabel>
              <Input
                id="foodExpiryAt"
                name="foodExpiryAt"
                type="datetime-local"
                required
              />
              <FieldDescription>
                Food-safety limit. Must be in the future and acts as a hard
                matching deadline.
              </FieldDescription>
              <FieldError>{result?.errors.foodExpiryAt}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="bestBeforeAt">Best-before (DDM)</FieldLabel>
              <Input
                id="bestBeforeAt"
                name="bestBeforeAt"
                type="datetime-local"
              />
              <FieldDescription>
                Quality hint only. A past date is flagged, never treated as
                expired.
              </FieldDescription>
              <FieldError>{result?.errors.bestBeforeAt}</FieldError>
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="pickupDeadlineAt">
                Pickup deadline *
              </FieldLabel>
              <Input
                id="pickupDeadlineAt"
                name="pickupDeadlineAt"
                type="datetime-local"
                required
              />
              <FieldDescription>
                The time by which collection must finish. Also a hard deadline;
                must be in the future.
              </FieldDescription>
              <FieldError>{result?.errors.pickupDeadlineAt}</FieldError>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage and packaging</CardTitle>
            <CardDescription>
              Storage affects which recipients can safely accept the donation.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="storage">Storage *</FieldLabel>
              <Select
                id="storage"
                name="storage"
                defaultValue="ambient"
                required
              >
                {STORAGE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {labelFor(option)}
                  </option>
                ))}
              </Select>
              <FieldError>{result?.errors.storage}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="packaging">Packaging</FieldLabel>
              <Input
                id="packaging"
                name="packaging"
                placeholder="Sealed trays"
                maxLength={120}
              />
              <FieldDescription>
                Optional handling notes for volunteers.
              </FieldDescription>
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Allergens and dietary flags</CardTitle>
            <CardDescription>Select every option that applies.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium">Allergens</legend>
              {ALLERGEN_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 capitalize"
                >
                  <Checkbox name="allergens" value={option} />
                  {labelFor(option)}
                </label>
              ))}
              <FieldError>{result?.errors.allergens}</FieldError>
            </fieldset>
            <fieldset className="grid gap-3">
              <legend className="text-sm font-medium">Dietary flags</legend>
              {DIETARY_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 capitalize"
                >
                  <Checkbox name="dietTags" value={option} />
                  {labelFor(option)}
                </label>
              ))}
              <FieldError>{result?.errors.dietTags}</FieldError>
            </fieldset>
          </CardContent>
        </Card>

        <Button type="submit">Validate dates</Button>
      </form>

      {result?.warnings.length ? (
        <Card role="status">
          <CardHeader>
            <CardTitle>Check before publishing</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 text-sm text-muted-foreground">
              {result.warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {result?.values ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 saved for this draft</CardTitle>
            <CardDescription>
              Effective deadline is the earlier of use-by and pickup deadline.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <p>
              <span className="font-medium">Use-by:</span>{" "}
              {formatDateTime(result.values.foodExpiryAt)}
            </p>
            <p>
              <span className="font-medium">Best-before:</span>{" "}
              {result.values.bestBeforeAt
                ? formatDateTime(result.values.bestBeforeAt)
                : "not supplied"}
            </p>
            <p>
              <span className="font-medium">Pickup deadline:</span>{" "}
              {formatDateTime(result.values.pickupDeadlineAt)}
            </p>
            <p>
              <span className="font-medium">Effective deadline:</span>{" "}
              {formatDateTime(result.values.effectiveDeadlineAt)}
            </p>
            <p className="flex flex-wrap gap-2">
              <Badge variant="secondary">{result.values.storage}</Badge>
              {result.values.allergens.map((allergen) => (
                <Badge key={allergen} variant="outline">
                  {labelFor(allergen)}
                </Badge>
              ))}
              {result.values.dietTags.map((tag) => (
                <Badge key={tag} variant="success">
                  {labelFor(tag)}
                </Badge>
              ))}
            </p>
            <Link
              href="#pickup-location"
              className={cn(buttonVariants(), "w-fit")}
            >
              Review pickup details
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
