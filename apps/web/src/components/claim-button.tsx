"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

interface Me {
  user: { role?: string; activeOrganizationId?: string | null } | null;
}

export function ClaimButton({
  donationId,
  available,
  status,
}: {
  donationId: string;
  available: number;
  status: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const disabled = pending || status !== "published" || available <= 0;

  async function claim() {
    setPending(true);
    try {
      const meResponse = await fetch("/api/me");
      if (!meResponse.ok) throw new Error("Sign in to claim this donation");
      const me = (await meResponse.json()) as Me;
      const organizationId = me.user?.activeOrganizationId;
      if (me.user?.role !== "recipient" || !organizationId) {
        throw new Error("A recipient organization is required to claim");
      }
      const key = crypto.randomUUID();
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "idempotency-key": key,
        },
        body: JSON.stringify({
          donation_id: donationId,
          recipient_id: organizationId,
          servings: 1,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(body?.message ?? "Claim failed");
      }
      // handover moment: short, auto-dismissed, always offers the next action
      toast.success("Claim sent to the kitchen", {
        description: "Track pickup progress under My activity.",
        action: {
          label: "View",
          onClick: () => {
            router.push("/recipient/claims");
            router.refresh();
          },
        },
      });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Claim failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      className="primary-action claim-button"
      disabled={disabled}
      title={disabled ? "This donation is not available to claim" : undefined}
      onClick={() => void claim()}
    >
      {pending ? "Sending claim…" : "Claim this donation"}
    </Button>
  );
}
