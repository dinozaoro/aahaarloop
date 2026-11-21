"use client";

import "leaflet/dist/leaflet.css";

import type { GeoPoint } from "@aahaarloop/shared";

import { clusterByArea } from "@/lib/maps/clustering";
import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

export interface MapOffer {
  id: string;
  title: string;
  donorName: string;
  location: GeoPoint;
  distanceKm: number | null;
}

export function DonationMap({
  offers,
  recipientLocation,
}: {
  offers: MapOffer[];
  recipientLocation: GeoPoint | null;
}) {
  const center: GeoPoint = recipientLocation ??
    offers[0]?.location ?? { latitude: 12.9716, longitude: 77.5946 };
  const clusters = clusterByArea(offers);

  return (
    <div
      role="region"
      aria-label="Map of nearby donations"
      className="donation-map"
    >
      <MapContainer
        center={[center.latitude, center.longitude]}
        zoom={12}
        scrollWheelZoom={false}
        style={{ height: 420, width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {recipientLocation ? (
          <CircleMarker
            center={[recipientLocation.latitude, recipientLocation.longitude]}
            radius={9}
            pathOptions={{
              color: "#063a2a",
              fillColor: "#fffbed",
              fillOpacity: 1,
            }}
          >
            <Popup>Your kitchen</Popup>
          </CircleMarker>
        ) : null}
        {clusters.map((cluster) => (
          <CircleMarker
            key={cluster.key}
            center={[cluster.point.latitude, cluster.point.longitude]}
            radius={cluster.offers.length > 1 ? 14 : 9}
            pathOptions={{
              color: "#063a2a",
              fillColor: cluster.offers.length > 1 ? "#a05f32" : "#cb844f",
              fillOpacity: 0.9,
            }}
          >
            <Popup>
              <strong>
                {cluster.offers.length > 1
                  ? `${cluster.offers.length} donations nearby`
                  : cluster.offers[0].title}
              </strong>
              <ul>
                {cluster.offers.map((offer) => (
                  <li key={offer.id}>
                    <Link href={`/browse/${offer.id}`}>{offer.title}</Link>
                    {" · "}
                    {offer.donorName}
                  </li>
                ))}
              </ul>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
