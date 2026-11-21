import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { calculateUrgency } from "@aahaarloop/matching";

import {
  DEFAULT_ADMIN_CONFIG,
  getAdminConfig,
  getConfigVersion,
  onConfigChange,
  toMatchingConfig,
  updateAdminConfig,
  validateAdminConfig,
} from "../src/lib/config/admin-config.ts";
import { rankMatches } from "../src/lib/matching/ranked-matches.ts";

const NOW = "2026-11-21T10:00:00Z";

function reset() {
  updateAdminConfig({
    city: DEFAULT_ADMIN_CONFIG.city,
    donorSegment: DEFAULT_ADMIN_CONFIG.donorSegment,
    safetyBufferMinutes: DEFAULT_ADMIN_CONFIG.safetyBufferMinutes,
    urgencyThresholds: { ...DEFAULT_ADMIN_CONFIG.urgencyThresholds },
    matchingWeights: { ...DEFAULT_ADMIN_CONFIG.matchingWeights },
  });
}

const organization = {
  id: "org-1",
  kind: "recipient",
  name: "Kitchen",
  area: "Central",
  address: "1 Main St",
  location: { latitude: 12.97, longitude: 77.59 },
  verified: true,
  capacityServings: 100,
  storage: "ambient",
  transportCapacityKg: 1000,
};

function donation(id, lat, deadlineHours, organizationId = "org-other") {
  return {
    id,
    organizationId,
    location: { latitude: lat, longitude: 77.59 },
    title: id,
    category: "prepared",
    dietTags: [],
    storage: "ambient",
    servingsTotal: 50,
    servingsAvailable: 50,
    weightKg: 50,
    pickupArea: "Central",
    pickupDeadlineAt: new Date(Date.parse(NOW) + deadlineHours * 3_600_000).toISOString(),
    status: "published",
  };
}

test("documented defaults match the engine defaults", () => {
  assert.deepEqual(DEFAULT_ADMIN_CONFIG.urgencyThresholds, {
    criticalHours: 3,
    highHours: 6,
    mediumHours: 12,
  });
  assert.equal(DEFAULT_ADMIN_CONFIG.safetyBufferMinutes, 15);
  assert.equal(DEFAULT_ADMIN_CONFIG.city, "Bengaluru");
  assert.deepEqual(
    toMatchingConfig(DEFAULT_ADMIN_CONFIG).weights,
    DEFAULT_ADMIN_CONFIG.matchingWeights,
  );
});

test("invalid values are rejected before they reach the store", () => {
  const base = structuredClone(DEFAULT_ADMIN_CONFIG);
  assert.throws(() => validateAdminConfig({ ...base, city: "  " }), /city/);
  assert.throws(
    () => validateAdminConfig({ ...base, urgencyThresholds: { ...base.urgencyThresholds, criticalHours: 8 } }),
    /urgencyThresholds/,
  );
  assert.throws(
    () => validateAdminConfig({ ...base, matchingWeights: { ...base.matchingWeights, distance: -1 } }),
    /non-negative/,
  );
  assert.throws(
    () => validateAdminConfig({ ...base, matchingWeights: { urgency: 0, distance: 0, quantity: 0, needs: 0, availability: 0, logistics: 0 } }),
    /positive sum/,
  );
  assert.throws(
    () => validateAdminConfig({ ...base, safetyBufferMinutes: -5 }),
    /safetyBufferMinutes/,
  );
});

test("changing a threshold changes urgency output", () => {
  try {
    const input = {
      now: NOW,
      pickupDeadlineAt: new Date(Date.parse(NOW) + 4 * 3_600_000).toISOString(),
      bufferMinutes: 0,
    };
    assert.equal(calculateUrgency(input).level, "high");
    updateAdminConfig({
      urgencyThresholds: { criticalHours: 5, highHours: 8, mediumHours: 12 },
    });
    const thresholds = toMatchingConfig(getAdminConfig()).urgencyThresholds;
    assert.equal(
      calculateUrgency({ ...input, thresholds }).level,
      "critical",
    );
  } finally {
    reset();
  }
});

test("changing weights changes match ranking", () => {
  try {
    const donations = [donation("near-low-urgency", 12.98, 13), donation("far-high-urgency", 12.85, 4)];
    const filters = { page: 1, pageSize: 10 };

    updateAdminConfig({
      matchingWeights: {
        urgency: 0, distance: 1, quantity: 0, needs: 0, availability: 0, logistics: 0,
      },
    });
    const byDistance = rankMatches(organization, [], donations, filters, NOW, toMatchingConfig(getAdminConfig()));
    assert.equal(byDistance.data[0].donationId, "near-low-urgency");

    updateAdminConfig({
      matchingWeights: {
        urgency: 1, distance: 0, quantity: 0, needs: 0, availability: 0, logistics: 0,
      },
    });
    const byUrgency = rankMatches(organization, [], donations, filters, NOW, toMatchingConfig(getAdminConfig()));
    assert.equal(byUrgency.data[0].donationId, "far-high-urgency");
  } finally {
    reset();
  }
});

test("updates notify dependents so caches can be invalidated, invalid updates do not", () => {
  const seen = [];
  const unsubscribe = onConfigChange((config) => seen.push(config));
  const before = getConfigVersion();
  try {
    updateAdminConfig({ city: "Mysuru" });
    assert.equal(seen.length, 1);
    assert.equal(seen[0].city, "Mysuru");
    assert.equal(getConfigVersion(), before + 1);

    assert.throws(() => updateAdminConfig({ city: "" }), /city/);
    assert.equal(seen.length, 1);
    assert.equal(getConfigVersion(), before + 1);
  } finally {
    unsubscribe();
    reset();
  }
});

test("config routes are admin-guarded and reads include the version", async () => {
  const source = await readFile(new URL("../src/app/api/admin/config/route.ts", import.meta.url), "utf8");
  assert.match(source, /forbidUnlessRole\(\["admin"\]\)/);
  assert.match(source, /getConfigVersion\(\)/);

  const matches = await readFile(new URL("../src/app/api/matches/route.ts", import.meta.url), "utf8");
  assert.match(matches, /toMatchingConfig\(getAdminConfig\(\)\)/);
  assert.match(matches, /onConfigChange\(\(\) => cache\.invalidateAll\(\)\)/);
});
