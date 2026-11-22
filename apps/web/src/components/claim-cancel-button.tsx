"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export function ClaimCancelButton({ claimId }: { claimId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const response = await fetch(`/api/claims/${claimId}/cancel`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("Cancellation was rejected. Check the reason and current status.");
      return;
    }
    setReason("");
    router.refresh();
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="press-scale">
          Cancel claim
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this claim?</DialogTitle>
          <DialogDescription>
            The reserved quantity is released when the claim is cancelled. This
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <label className="space-y-1 text-sm" htmlFor={`reason-${claimId}`}>
          Reason
          <Input
            id={`reason-${claimId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. no longer needed"
            maxLength={500}
          />
        </label>
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Keep claim</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={busy || reason.trim().length === 0}
            onClick={() => void submit()}
          >
            {busy ? "Cancelling…" : "Confirm cancellation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
