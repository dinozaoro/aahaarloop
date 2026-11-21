import Link from "next/link";
import type { Donation } from "@/lib/domain/types";

type Location = Donation["location"];

function point(location: Location) {
  return {
    x: Math.min(88, Math.max(12, 50 + (location.longitude - 77.58) * 800)),
    y: Math.min(86, Math.max(14, 50 - (location.latitude - 12.97) * 800)),
  };
}

export function SchematicMap({ from, to, fromLabel, toLabel, href, className = "" }: {
  from: Location | null;
  to: Location | null;
  fromLabel: string;
  toLabel: string;
  href: string;
  className?: string;
}) {
  const start = from ? point(from) : null;
  const end = to ? point(to) : null;

  return <section className={`schematic-map ${className}`} aria-label={`Schematic route from ${fromLabel} to ${toLabel}`}>
    <div className="map-grid" aria-hidden="true" />
    {start && end ? <svg className="map-route" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={`M ${start.x} ${start.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`} /></svg> : null}
    {start ? <Link className="map-marker map-marker-donor" style={{ left: `${start.x}%`, top: `${start.y}%` }} href={href} aria-label={`Open pickup details for ${fromLabel}`}><span />{fromLabel}</Link> : null}
    {end ? <span className="map-marker map-marker-recipient" style={{ left: `${end.x}%`, top: `${end.y}%` }}><span />{toLabel}</span> : null}
    <small>Schematic map · demo locations</small>
  </section>;
}
