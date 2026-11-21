import assert from "node:assert/strict";
import test from "node:test";

import { clusterByArea } from "../src/lib/maps/clustering.ts";

test("nearby offers collapse into one cluster and distant ones stay separate", () => {
  const clusters = clusterByArea([
    { id: "a", location: { latitude: 12.9716, longitude: 77.5946 } },
    { id: "b", location: { latitude: 12.975, longitude: 77.598 } },
    { id: "c", location: { latitude: 13.05, longitude: 77.62 } },
  ]);
  assert.equal(clusters.length, 2);
  assert.deepEqual(
    clusters.map((cluster) => cluster.offers.length),
    [2, 1],
  );
  assert.ok(clusters[0].offers.some((offer) => offer.id === "a"));
});
