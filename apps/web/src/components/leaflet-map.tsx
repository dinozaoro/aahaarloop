"use client";

import { useEffect } from "react";
import Link from "next/link";
import type { LatLngTuple } from "leaflet";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Donation } from "@/lib/domain/types";

type Location = Donation["location"];

const BENGALURU: LatLngTuple = [12.97, 77.58];
const ROUTE_COLOR = "#E12620";
const RECIPIENT_COLOR = "#FFC928";

function toTuple(location: Location | null): LatLngTuple | null {
  return location ? [location.latitude, location.longitude] : null;
}

function RouteViewport({ start, end }: { start: LatLngTuple | null; end: LatLngTuple | null }) {
  const map = useMap();
  const startLat = start?.[0];
  const startLng = start?.[1];
  const endLat = end?.[0];
  const endLng = end?.[1];

  useEffect(() => {
    if (startLat !== undefined && startLng !== undefined && endLat !== undefined && endLng !== undefined) {
      map.fitBounds([[startLat, startLng], [endLat, endLng]], { padding: [40, 40], maxZoom: 15 });
      return;
    }
    if (startLat !== undefined && startLng !== undefined) {
      map.setView([startLat, startLng], 13);
      return;
    }
    if (endLat !== undefined && endLng !== undefined) {
      map.setView([endLat, endLng], 13);
      return;
    }
    map.setView(BENGALURU, 12);
  }, [map, startLat, startLng, endLat, endLng]);

  return null;
}

export default function LeafletMap({ from, to, fromLabel, toLabel, href, className = "" }: {
  from: Location | null;
  to: Location | null;
  fromLabel: string;
  toLabel: string;
  href: string;
  className?: string;
}) {
  const start = toTuple(from);
  const end = toTuple(to);

  return <div className={`leaflet-map ${className}`} style={{ position: "absolute", inset: 0 }}>
    <MapContainer center={start ?? end ?? BENGALURU} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <RouteViewport start={start} end={end} />
      {start ? <CircleMarker center={start} radius={9} pathOptions={{ color: "#fff", weight: 2, fillColor: ROUTE_COLOR, fillOpacity: 1 }}>
        <Popup>
          <strong>{fromLabel}</strong>
          <br />
          <Link href={href}>Open pickup details</Link>
        </Popup>
      </CircleMarker> : null}
      {end ? <CircleMarker center={end} radius={9} pathOptions={{ color: "#fff", weight: 2, fillColor: RECIPIENT_COLOR, fillOpacity: 1 }}>
        <Popup>
          <strong>{toLabel}</strong>
        </Popup>
      </CircleMarker> : null}
    </MapContainer>
  </div>;
}
