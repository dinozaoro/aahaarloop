"use client";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DEMO_DONOR_ORG_ID } from "@/lib/data/constants";
import { getClaimsForDonor, getOrganization } from "@/lib/data/store";
import {
  CLAIM_STATUS_LABELS,
  DONATION_STATUS_LABELS,
} from "@/lib/domain/types";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

export default function RecipientProfilePage() {
  const organization = getOrganization(DEMO_DONOR_ORG_ID);
  const [openModal, setOpenModal] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">Profile recipient</h1>
        <Link
          href="/donations/management"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          ← Back to management
        </Link>
      </div>

      {organization ? (
        <Card className="gap-4">
          <CardHeader>
            <CardTitle>{organization.name}</CardTitle>
            <CardDescription>{organization.description}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div>
                <dt className="sr-only">ID</dt>
                <dd>{organization.id}</dd>
              </div>
              <div>
                <dt className="sr-only">Localisation</dt>
                <dd>
                  {organization.area}
                  {organization.location ? (
                    <div className="mt-2">
                      <span className="sr-only">Coordinates</span>
                      <code className="text-xs monospace bg-muted/30 p-1 rounded">
                        {organization.location.latitude},{" "}
                        {organization.location.longitude}
                      </code>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Coordonnées non disponibles
                    </p>
                  )}
                </dd>
              </div>
              <div>
                <dt className="sr-only">Téléphone</dt>
                <dd>{organization.contactPhone}</dd>
              </div>
              <div>
                <dt className="sr-only">Email</dt>
                <dd>{organization.contactEmail || "Non publié"}</dd>
              </div>
            </dl>

            <CardFooter>
              <button
                onClick={() => setOpenModal(true)}
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Voir les claims récents
              </button>

              <Link
                href="/donations/management"
                className="ml-2 text-sm text-primary underline-offset-4 hover:underline"
              >
                Retour aux dons
              </Link>
            </CardFooter>
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground">Organisation démo introuvable</p>
      )}

      {/* Geocoding fallback modal */}
      {openModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-bl-zend flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-semibold mb-4">Claims récents</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Aucun claim récent pour cette organisation (démo en mémoire)
            </p>
            <button
              onClick={() => setOpenModal(false)}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
