import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { WorkspaceShell } from "@/components/workspace-shell";
import { getAllDonations, getOrganization } from "@/lib/data/store";
import { CATEGORY_LABELS, STORAGE_LABELS } from "@/lib/domain/types";

export const metadata: Metadata = { title: "Discover food" };

export default function BrowsePage() {
  const donations = getAllDonations().filter((item) => item.servingsAvailable > 0 && item.status === "published");
  return <WorkspaceShell><div className="page-heading"><div><p className="page-kicker">Find food nearby</p><h1>Offers for your kitchen.</h1><p>Available surplus, matched to your collection window.</p></div><div className="view-switch"><button className="selected">☷ List</button><button>⌖ Map</button></div></div>
    <div className="search-row"><label className="search-box"><span>⌕</span><input aria-label="Search food or area" placeholder="Search food or area" /></label><button className="filter-button">☷ Filters <span>3</span></button><label className="sort-select">Sort by <select defaultValue="match"><option value="match">Best match</option><option value="distance">Nearest</option><option value="deadline">Pickup deadline</option></select></label></div>
    <div className="browse-layout"><aside className="filter-rail"><div className="filter-group"><h2>Food type</h2>{["Prepared meals", "Bakery", "Fresh produce", "Dairy"].map((label, i) => <label key={label}><input type="checkbox" defaultChecked={i === 0} /> {label}</label>)}</div><div className="filter-group"><h2>Pickup distance</h2><p className="distance-value">Within <strong>5 km</strong></p><input type="range" min="1" max="20" defaultValue="5" aria-label="Maximum distance in kilometres" /></div><div className="filter-group"><h2>Handling</h2><label><input type="checkbox" /> Chilled storage</label><label><input type="checkbox" /> No listed allergens</label></div><p className="filter-note">Always review food condition and allergen details with the donor.</p></aside>
      <section className="offer-list" aria-label="Available donations">{donations.length ? donations.map((item, index) => { const donor = getOrganization(item.organizationId); return <article className="offer-card" key={item.id}><div className={`offer-photo food-thumb-${index}`}><Image src="/images/tasty-bowl.webp" width={480} height={360} alt="" /><span className="offer-match">Good match</span></div><div className="offer-content"><div className="offer-title-line"><span className="food-category">{CATEGORY_LABELS[item.category]}</span><span className="distance-chip">2.4 km away</span></div><h2>{item.title}</h2><p>{donor?.name ?? "Food partner"} · {item.pickupArea}</p><div className="offer-meta"><span><b>{item.servingsAvailable}</b> servings</span><span>{STORAGE_LABELS[item.storage]}</span><span>Collect by {new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(item.pickupDeadlineAt))}</span></div><div className="allergen-note">{item.allergens.length ? `Contains ${item.allergens.join(", ")}` : "No listed allergens"}</div><Link href={`/browse/${item.id}`} className="offer-open">View donation <span>→</span></Link></div></article>; }) : <div className="empty-state"><h2>No offers are available right now.</h2><p>Try widening your distance or check back later today.</p></div>}</section>
    </div><p className="sample-note">Example workspace · availability and distances use seeded preview data.</p>
  </WorkspaceShell>;
}
