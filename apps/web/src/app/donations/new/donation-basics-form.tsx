"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, type FoodCategory } from "@/lib/domain/types";
import { readDraft, writeDraft } from "@/lib/donations/draft";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

const categories = Object.keys(CATEGORY_LABELS) as FoodCategory[];

export function DonationBasicsForm() {
  const [saved, setSaved] = useState(false);
  const [initial, setInitial] = useState<{
    foodName: string;
    category: FoodCategory;
    servings: number;
    description: string;
  } | null>(null);

  useEffect(() => {
    queueMicrotask(() => setInitial(readDraft(sessionStorage).basics));
  }, []);

  function saveBasics(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const draft = readDraft(sessionStorage);
    writeDraft(sessionStorage, {
      ...draft,
      basics: {
        foodName: String(data.get("foodName") ?? "").trim(),
        category: String(data.get("category") ?? "prepared") as FoodCategory,
        servings: Number(data.get("servings")),
        description: String(data.get("description") ?? "").trim(),
      },
    });
    setSaved(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>What is available?</CardTitle>
        <CardDescription>Start with the details a nearby kitchen needs to decide.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={saveBasics} className="flex flex-col gap-5">
          <Field>
            <FieldLabel htmlFor="foodName">Food name</FieldLabel>
            <Input id="foodName" name="foodName" placeholder="Vegetable biryani" maxLength={120} required defaultValue={initial?.foodName} />
          </Field>
          <Field>
            <FieldLabel htmlFor="foodPhoto">Food photo <span className="text-muted-foreground">(optional)</span></FieldLabel>
            <Input id="foodPhoto" name="foodPhoto" type="file" accept="image/jpeg,image/png,image/webp" />
            <FieldDescription>A clear photo helps nearby kitchens recognise the offer.</FieldDescription>
          </Field>
          <div className="grid gap-5 sm:grid-cols-[1fr_11rem]">
            <Field>
              <FieldLabel htmlFor="category">Food type</FieldLabel>
              <Select id="category" name="category" defaultValue={initial?.category ?? "prepared"}>
                {categories.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="servings">Approx. servings</FieldLabel>
              <Input id="servings" name="servings" type="number" inputMode="numeric" min="1" max="100000" defaultValue={initial?.servings} required />
              <FieldDescription>Estimate is fine.</FieldDescription>
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="description">Preparation or source details</FieldLabel>
            <Textarea id="description" name="description" maxLength={500} placeholder="Prepared this afternoon; packed in covered trays." defaultValue={initial?.description} />
          </Field>
          <p className="text-xs leading-5 text-muted-foreground">Your draft stays in this browser tab. AahaarLoop does not certify food safety.</p>
          {saved ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
              <p role="status" className="text-sm text-success">Details saved for this draft.</p>
              <Link href="/donations/new/dates" className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">Add pickup timing <ArrowRight aria-hidden="true" className="size-4" /></Link>
            </div>
          ) : (
            <Button type="submit" className="w-fit">Continue to pickup timing <ArrowRight aria-hidden="true" /></Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
