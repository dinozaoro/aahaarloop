import { Breadcrumbs, PageHeader } from "@/components/page-chrome";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RECIPIENT_ORG_ID } from "@/lib/data/constants";
import { getOrganization } from "@/lib/data/store";
import { ArrowRight, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/workspace-shell";

export default function RecipientProfilePage() {
  const organization = getOrganization(RECIPIENT_ORG_ID);

  return (
    <WorkspaceShell><div className="site-shell flex flex-col gap-7 py-10 sm:py-14">
      <Breadcrumbs items={[{ label: "Recipient" }, { label: "Organisation" }]} />
      <PageHeader
        title="Organisation details"
        description="Contact and location information used when coordinating a food pickup."
        actions={<Link href="/recipient/needs" className="text-sm font-semibold text-primary">Manage food needs <ArrowRight aria-hidden="true" size={14} /></Link>}
      />
      {organization ? (
        <Card className="max-w-3xl">
          <CardHeader>
            <p className="eyebrow">Recipient organisation</p>
            <CardTitle className="text-2xl">{organization.name}</CardTitle>
            <p className="text-sm leading-6 text-muted-foreground">{organization.description}</p>
          </CardHeader>
          <CardContent className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2">
            <div className="flex items-start gap-3 text-sm">
              <MapPin aria-hidden="true" className="mt-0.5 size-4 text-primary" />
              <div><p className="font-medium">Pickup area</p><p className="mt-1 text-muted-foreground">{organization.area}</p></div>
            </div>
            <div className="flex items-start gap-3 text-sm">
              <Phone aria-hidden="true" className="mt-0.5 size-4 text-primary" />
              <div><p className="font-medium">Contact</p><p className="mt-1 text-muted-foreground">{organization.contactPhone}</p></div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">Profile edits are not connected to an account yet.</p>
          </CardContent>
        </Card>
      ) : <p className="text-sm text-muted-foreground">No recipient organisation is configured.</p>}
    </div></WorkspaceShell>
  );
}
