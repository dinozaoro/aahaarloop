"use client";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Donation } from "@/lib/domain/types";
import { Maximize2 } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";

type Location = Donation["location"];

const LeafletMap = dynamic(() => import("@/components/leaflet-map"), {
  ssr: false,
  loading: () => <div aria-hidden="true" />,
});

export function SchematicMap({
  from,
  to,
  fromLabel,
  toLabel,
  href,
  className = "",
}: {
  from: Location | null;
  to: Location | null;
  fromLabel: string;
  toLabel: string;
  href: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const map = (
    <LeafletMap
      from={from}
      to={to}
      fromLabel={fromLabel}
      toLabel={toLabel}
      href={href}
      className={className}
    />
  );

  return (
    <>
      <section
        className={`schematic-map ${className}`}
        aria-label={`Map route from ${fromLabel} to ${toLabel}`}
      >
        {expanded ? null : map}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="Expand map"
          className="absolute right-3 bottom-3 z-[800] grid size-8 place-items-center rounded-md border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Maximize2 aria-hidden="true" className="size-4" />
        </button>
      </section>
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="h-[min(80vh,720px)] w-[min(1000px,calc(100%-2rem))] max-w-none gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">
            Map route from {fromLabel} to {toLabel}
          </DialogTitle>
          <div className="relative h-full w-full">{map}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
