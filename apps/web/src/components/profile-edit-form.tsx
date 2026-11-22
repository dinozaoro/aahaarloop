"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface ProfileEditFormProps {
  role: "donor" | "recipient" | "volunteer" | "admin";
  displayName: string;
  phone: string;
  organizationName?: string;
  transportCapacityKg?: number;
}

export function ProfileEditForm({
  role,
  displayName,
  phone,
  organizationName,
  transportCapacityKg,
}: ProfileEditFormProps) {
  const [name, setName] = useState(displayName);
  const [contact, setContact] = useState(phone);
  const [organization, setOrganization] = useState(organizationName ?? "");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const body = {
        role,
        display_name: name,
        phone: contact,
        ...(role === "donor" || role === "recipient"
          ? { organization_name: organization }
          : {}),
        ...(role === "recipient"
          ? { storage: "ambient", transport_capacity_kg: transportCapacityKg ?? 0 }
          : {}),
      };
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(result?.message ?? "Profile could not be saved");
      }
      toast.success("Profile saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Profile could not be saved");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="profile-edit-form flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="profile-display-name">Contact name</FieldLabel>
        <Input
          id="profile-display-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="profile-phone">Contact number</FieldLabel>
        <Input
          id="profile-phone"
          value={contact}
          onChange={(event) => setContact(event.target.value)}
        />
      </Field>
      {role === "donor" || role === "recipient" ? (
        <Field>
          <FieldLabel htmlFor="profile-organization">Organization name</FieldLabel>
          <Input
            id="profile-organization"
            value={organization}
            onChange={(event) => setOrganization(event.target.value)}
          />
        </Field>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
