"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { Utensils } from "lucide-react";
import { useMemo, useState } from "react";

import type { Donation } from "@/lib/domain/types";
import { CATEGORY_LABELS } from "@/lib/domain/types";
import { SchematicMap } from "@/components/schematic-map";
import { FavoriteButton } from "@/components/favorite-button";

const DonationMap = dynamic(
  () => import("@/components/donation-map").then((module) => module.DonationMap),
  { ssr: false, loading: () => <div className="map-loading">Loading map…</div> },
);

type Location = Donation["location"];
type Offer = { donation: Donation; donorName: string; distanceKm: number | null; donorLocation: Location | null };
const categories = Object.keys(CATEGORY_LABELS) as Donation["category"][];
const formatDistance = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 1 });

function foodPhoto(title: string) {
  const name = title.toLocaleLowerCase("en-IN");
  if (name.includes("biryani")) return "/images/food-biryani.png";
  if (name.includes("idli")) return "/images/food-idli.png";
  if (name.includes("fruit")) return "/images/food-fruit-packs.png";
  return null;
}

export function BrowseExperience({ offers, recipientLocation }: { offers: Offer[]; recipientLocation: Location | null }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [vegetarianOnly, setVegetarianOnly] = useState(true);
  const [radius, setRadius] = useState(5);
  const [portionLimit, setPortionLimit] = useState(100);
  const [pickupToday, setPickupToday] = useState(false);
  const [storage, setStorage] = useState("all");
  const [noAllergens, setNoAllergens] = useState(false);
  const [sort, setSort] = useState("deadline");
  const [view, setView] = useState<"list" | "map">("list");

  const visibleOffers = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("en-IN");
    return offers.filter(({ donation, donorName, distanceKm }) => {
      const textMatches = !search || [donation.title, donation.pickupArea, donorName, CATEGORY_LABELS[donation.category]].some((part) => part.toLocaleLowerCase("en-IN").includes(search));
      const today = new Date().toDateString() === new Date(donation.pickupDeadlineAt).toDateString();
      return textMatches
        && (category === "all" || donation.category === category)
        && (!vegetarianOnly || donation.dietTags.includes("vegetarian"))
        && (distanceKm === null || distanceKm <= radius)
        && donation.servingsAvailable <= portionLimit
        && (!pickupToday || today)
        && (storage === "all" || donation.storage === storage)
        && (!noAllergens || donation.allergens.length === 0);
    }).sort((a, b) => sort === "nearest"
      ? (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY)
      : sort === "recent"
        ? b.donation.createdAt.localeCompare(a.donation.createdAt)
        : a.donation.pickupDeadlineAt.localeCompare(b.donation.pickupDeadlineAt));
  }, [offers, query, category, vegetarianOnly, radius, portionLimit, pickupToday, storage, noAllergens, sort]);

  const selected = visibleOffers[0];
  const mapOffers = visibleOffers.flatMap(({ donation, donorName, donorLocation, distanceKm }) =>
    donorLocation
      ? [{ id: donation.id, title: donation.title, donorName, location: donorLocation, distanceKm }]
      : [],
  );
  return <>
    <form className="discover-search" onSubmit={(event) => event.preventDefault()}>
      <label htmlFor="discover-query">Search food or donor</label>
      <div className="discover-search-controls"><span aria-hidden="true">⌕</span><input id="discover-query" placeholder="Try biryani, idli or rice" value={query} onChange={(event) => setQuery(event.target.value)} /><button className="primary-action" type="submit">Search</button></div>
    </form>

    <div className="discover-filters" aria-label="Filter donations">
      <label className={`filter-pill filter-pill-check${vegetarianOnly ? " selected" : ""}`}><input type="checkbox" checked={vegetarianOnly} onChange={(event) => setVegetarianOnly(event.target.checked)} /> Vegetarian</label>
      <label className="filter-pill"><span className="sr-only">Food category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All food</option>{categories.map((item) => <option key={item} value={item}>{CATEGORY_LABELS[item]}</option>)}</select></label>
      <label className="filter-pill"><span>Within</span><select aria-label="Maximum pickup distance" value={radius} onChange={(event) => setRadius(Number(event.target.value))}>{[3, 5, 10, 20].map((km) => <option key={km} value={km}>{km} km</option>)}</select></label>
      <label className="filter-pill"><span>Up to</span><select aria-label="Maximum portions" value={portionLimit} onChange={(event) => setPortionLimit(Number(event.target.value))}>{[25, 50, 100, 500].map((count) => <option key={count} value={count}>{count} portions</option>)}</select></label>
      <label className={`filter-pill filter-pill-check${pickupToday ? " selected" : ""}`}><input type="checkbox" checked={pickupToday} onChange={(event) => setPickupToday(event.target.checked)} /> Pickup today</label>
      <label className="filter-pill"><span>Storage</span><select aria-label="Storage handling" value={storage} onChange={(event) => setStorage(event.target.value)}><option value="all">Any</option><option value="chilled">Chilled</option><option value="ambient">Ambient</option></select></label>
      <label className={`filter-pill filter-pill-check${noAllergens ? " selected" : ""}`}><input type="checkbox" checked={noAllergens} onChange={(event) => setNoAllergens(event.target.checked)} /> No listed allergens</label>
      <label className="filter-pill"><span>Sort</span><select aria-label="Sort donations" value={sort} onChange={(event) => setSort(event.target.value)}><option value="deadline">Pickup deadline</option><option value="nearest">Nearest</option><option value="recent">Recently added</option></select></label>
    </div>

    <div className="discover-results-heading"><span>{visibleOffers.length} nearby {visibleOffers.length === 1 ? "donation" : "donations"} · Bengaluru demo</span><span className="discover-view-switch" role="group" aria-label="View mode"><button type="button" className={view === "list" ? "selected" : ""} aria-pressed={view === "list"} onClick={() => setView("list")}>List</button><button type="button" className={view === "map" ? "selected" : ""} aria-pressed={view === "map"} onClick={() => setView("map")}>Map</button></span></div>
    {view === "list" ? (<div className="discover-layout">
      <section className="offer-list discover-offer-list" aria-label="Available donations">
        {visibleOffers.length ? visibleOffers.map(({ donation, donorName, distanceKm }) => {
          const image = foodPhoto(donation.title);
          return <article className="offer-card discover-offer-card" key={donation.id}>
            <Link href={`/browse/${donation.id}`} className="discover-offer-photo" aria-label={`View ${donation.title}`}>
              {image ? <Image src={image} fill sizes="(max-width: 700px) calc(100vw - 36px), (max-width: 1000px) 80vw, 38vw" alt="" /> : <span className="offer-category-mark" aria-hidden="true"><Utensils /></span>}
            </Link>
            <div className="discover-offer-copy"><h2><Link href={`/browse/${donation.id}`}>{donation.title}</Link></h2><p>{donorName} · {donation.pickupArea}</p><strong>{donation.servingsAvailable} portions · {donation.weightKg} kg</strong><span>Collect by {new Intl.DateTimeFormat("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit" }).format(new Date(donation.pickupDeadlineAt))}</span><small>{distanceKm === null ? "Distance unavailable" : `${formatDistance.format(distanceKm)} km · fits your pickup window`}</small><FavoriteButton donationId={donation.id} /></div>
          </article>;
        }) : <div className="empty-state"><h2>No offers match these filters.</h2><p>Widen the pickup distance or clear a filter to see available food.</p></div>}
      </section>

      <SchematicMap from={selected?.donorLocation ?? null} to={recipientLocation} fromLabel={selected?.donation.pickupArea ?? "Food donor"} toLabel="Community kitchen" href={selected ? `/browse/${selected.donation.id}` : "/browse"} />
    </div>
    ) : (
      <DonationMap offers={mapOffers} recipientLocation={recipientLocation} />
    )}
  </>;
}
