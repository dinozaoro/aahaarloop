"use client";

import dynamic from "next/dynamic";
import type { Donation } from "@/lib/domain/types";

type Location = Donation["location"];

const LeafletMap = dynamic(() => import("@/components/leaflet-map"), {
  ssr: false,
  loading: () => <div aria-hidden="true" />,
});

export function SchematicMap({ from, to, fromLabel, toLabel, href, className = "" }: {
  from: Location | null;
  to: Location | null;
  fromLabel: string;
  toLabel: string;
  href: string;
  className?: string;
}) {
  return <section className={`schematic-map ${className}`} aria-label={`Map route from ${fromLabel} to ${toLabel}`}>
    <LeafletMap from={from} to={to} fromLabel={fromLabel} toLabel={toLabel} href={href} className={className} />
  </section>;
}
