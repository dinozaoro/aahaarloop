import type { GeoPoint } from "@aahaarloop/shared";

export interface ClusterableOffer {
  id: string;
  location: GeoPoint;
}

export interface OfferCluster<T extends ClusterableOffer> {
  key: string;
  point: GeoPoint;
  offers: T[];
}

/** Groups offers into ~10 km cells so nearby pins collapse into one marker. */
export function clusterByArea<T extends ClusterableOffer>(
  offers: readonly T[],
): OfferCluster<T>[] {
  const groups = new Map<string, OfferCluster<T>>();
  for (const offer of offers) {
    const key = `${Math.round(offer.location.latitude * 10)}:${Math.round(offer.location.longitude * 10)}`;
    const cluster = groups.get(key);
    if (cluster) {
      cluster.offers.push(offer);
    } else {
      groups.set(key, {
        key,
        point: offer.location,
        offers: [offer],
      });
    }
  }
  return [...groups.values()];
}
