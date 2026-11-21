"use client";

import Link from "next/link";
import { ImagePlus, Utensils } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_LABELS, type FoodCategory } from "@/lib/domain/types";
import { readDraft, writeDraft } from "@/lib/donations/draft";

const categories = Object.keys(CATEGORY_LABELS) as FoodCategory[];

export function DonationBasicsForm() {
  const [saved, setSaved] = useState(false);
  const [initial, setInitial] = useState<{ foodName: string; category: FoodCategory; servings: number; unit?: "portions" | "kg" | "containers"; description: string } | null>(null);

  useEffect(() => { queueMicrotask(() => setInitial(readDraft(sessionStorage).basics)); }, []);

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
        unit: String(data.get("unit") ?? "portions") as "portions" | "kg" | "containers",
        description: String(data.get("description") ?? "").trim(),
      },
    });
    setSaved(true);
  }

  return <div className="donation-basics-grid">
    <aside className="donation-photo-column">
      <div className="donation-photo-placeholder"><Utensils aria-hidden="true" /><strong>Food worth sharing</strong><span>Add a clear photo of the surplus.</span></div>
      <Field className="donation-photo-field"><FieldLabel htmlFor="foodPhoto">Food photo <span>(optional)</span></FieldLabel><Input id="foodPhoto" name="foodPhoto" type="file" accept="image/jpeg,image/png,image/webp" /><FieldDescription>Use JPEG, PNG or WebP.</FieldDescription></Field>
      <p className="donation-safety-note">Food and handling details are provided by the donor. AahaarLoop does not certify food safety.</p>
    </aside>

    <form onSubmit={saveBasics} className="donation-food-form">
      <Field><FieldLabel htmlFor="foodName">Food name</FieldLabel><Input id="foodName" name="foodName" placeholder="Vegetable biryani" maxLength={120} required defaultValue={initial?.foodName} /></Field>
      <Field><FieldLabel htmlFor="category">Category</FieldLabel><Select id="category" name="category" defaultValue={initial?.category ?? "prepared"}>{categories.map((category) => <option key={category} value={category}>{CATEGORY_LABELS[category]}</option>)}</Select></Field>
      <div className="donation-quantity-row"><Field><FieldLabel htmlFor="servings">Quantity</FieldLabel><Input id="servings" name="servings" type="number" inputMode="numeric" min="1" max="100000" defaultValue={initial?.servings} required /></Field><Field><FieldLabel htmlFor="unit">Unit</FieldLabel><Select id="unit" name="unit" defaultValue={initial?.unit ?? "portions"}><option value="portions">Portions</option><option value="kg">Kilograms</option><option value="containers">Containers</option></Select></Field></div>
      <Field><FieldLabel htmlFor="description">Description</FieldLabel><Textarea id="description" name="description" maxLength={500} placeholder="Prepared this afternoon; packed in covered trays." defaultValue={initial?.description} /></Field>
      <p className="donation-draft-note">Your draft stays in this browser tab.</p>
      {saved ? <div className="donation-form-actions"><p role="status">Details saved for this draft.</p><Link href="/donations/new/dates" className="primary-action">Continue to pickup <ImagePlus aria-hidden="true" /></Link></div> : <Button type="submit" className="donation-continue">Continue to pickup <ImagePlus aria-hidden="true" /></Button>}
    </form>
  </div>;
}
