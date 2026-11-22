import { ClaimCancelButton } from "@/components/claim-cancel-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth/guards";
import {
  getClaims,
  getClaimsForDonor,
  getClaimsForOrganization,
} from "@/lib/data/store";
import {
  toClaimRow,
  type ClaimActor,
  type ProgressStep,
} from "@/lib/claims/view-model";
import { CLAIM_STATUS_LABELS } from "@/lib/domain/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Claims" };

const STATE_STYLE: Record<ProgressStep["state"], string> = {
  done: "bg-success text-success-foreground",
  current: "bg-primary text-primary-foreground",
  upcoming: "bg-secondary text-muted-foreground",
  closed: "bg-destructive text-destructive-foreground",
};

function Progress({ steps }: { steps: ProgressStep[] }) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Claim progress">
      {steps.map((step, index) => (
        <li
          key={`${step.status}-${index}`}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATE_STYLE[step.state]}`}
          aria-current={step.state === "current" ? "step" : undefined}
        >
          {step.label}
        </li>
      ))}
    </ol>
  );
}

export default async function ClaimsPage() {
  const user = await requireUser();
  const organizationId = user.activeOrganizationId;
  const actor: ClaimActor = { role: user.role, organizationId };

  const claims =
    user.role === "donor"
      ? getClaimsForDonor(organizationId ?? "")
      : user.role === "recipient"
        ? getClaimsForOrganization(organizationId ?? "")
        : user.role === "admin"
          ? getClaims()
          : [];
  const rows = claims.map((claim) => toClaimRow(claim, actor));
  const perspective = user.role === "donor" ? "donor" : "recipient";

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Claim tracking</h1>
        <p className="text-sm text-muted-foreground">
          {perspective === "donor"
            ? "Claims against your donations and their pickup or delivery progress."
            : "Your claims, their current status and the next action you need to take."}
        </p>
      </header>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No claims to show yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <Card key={row.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{row.donationTitle}</CardTitle>
                  <Badge variant={row.variant}>{row.statusLabel}</Badge>
                </div>
                <CardDescription>
                  {row.servings} servings · {row.id.slice(0, 8)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Next action
                  </p>
                  <p
                    className={
                      row.next.tone === "primary"
                        ? "text-sm font-medium text-foreground"
                        : "text-sm text-muted-foreground"
                    }
                  >
                    {row.next.label}
                  </p>
                </div>
                <Progress steps={row.progress} />
                <details className="rounded-md border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    History ({row.history.length})
                  </summary>
                  <ol className="mt-2 space-y-1 text-sm text-muted-foreground">
                    {row.history.map((event) => (
                      <li key={event.id}>
                        <span className="font-medium text-foreground">
                          {CLAIM_STATUS_LABELS[event.type as keyof typeof CLAIM_STATUS_LABELS] ?? event.type}
                        </span>{" "}
                        · {new Date(event.at).toLocaleString()}
                        {event.note ? ` · ${event.note}` : ""}
                      </li>
                    ))}
                  </ol>
                </details>
              </CardContent>
              {row.canCancel && (
                <div className="border-t border-border p-4">
                  <ClaimCancelButton claimId={row.id} />
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
