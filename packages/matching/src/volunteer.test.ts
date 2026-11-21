import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { matchDonationsForRecipient } from "./matching.ts";
import type { RecipientRequest } from "./matching.ts";
import {
  canAcceptMission,
  createVolunteerProfile,
  editVolunteerProfile,
  getMatchingVolunteerFields,
  isVolunteerAvailable,
  validateVolunteerProfile,
} from "./volunteer.ts";
import type {
  MissionRequirement,
  VolunteerProfile,
  VolunteerProfileInput,
} from "./volunteer.ts";

const NOW = "2026-11-21T10:00:00Z";
const HOUR_MS = 3_600_000;

const input: VolunteerProfileInput = {
  displayName: "  Meera Rao  ",
  transportMode: "bicycle",
  transportCapacityKg: 25,
  serviceArea: {
    center: { latitude: 12.9716, longitude: 77.5946 },
    radiusKm: 10,
  },
  availability: [
    { start: "2026-11-21T09:00:00Z", end: "2026-11-21T12:00:00Z" },
  ],
};

const mission: MissionRequirement = {
  pickupLocation: { latitude: 12.9816, longitude: 77.6046 },
  weightKg: 18,
  pickupWindow: {
    start: "2026-11-21T10:00:00Z",
    end: "2026-11-21T11:00:00Z",
  },
};

function profile(overrides: Partial<VolunteerProfile> = {}): VolunteerProfile {
  const created = createVolunteerProfile(input, NOW);
  assert.ok(created.profile);
  return { ...created.profile, verified: true, ...overrides };
}

describe("volunteer profile validation", () => {
  it("accepts a complete profile and trims the display name", () => {
    const result = createVolunteerProfile(input, NOW);
    assert.deepEqual(result.errors, []);
    assert.ok(result.profile);
    assert.equal(result.profile.displayName, "Meera Rao");
    assert.equal(result.profile.verified, false);
    assert.equal(Date.parse(result.profile.createdAt), Date.parse(NOW));
  });

  it("rejects an empty name, unsupported mode and non-positive capacity", () => {
    const errors = validateVolunteerProfile({
      ...input,
      displayName: "   ",
      transportMode: "rocket" as VolunteerProfileInput["transportMode"],
      transportCapacityKg: 0,
    });
    assert.deepEqual(
      errors.map((error) => error.field),
      ["displayName", "transportMode", "transportCapacityKg"],
    );
  });

  it("rejects an invalid service area", () => {
    const errors = validateVolunteerProfile({
      ...input,
      serviceArea: {
        center: { latitude: 91, longitude: 181 },
        radiusKm: -1,
      },
    });
    assert.deepEqual(
      errors.map((error) => error.field),
      [
        "serviceArea.radiusKm",
        "serviceArea.center.latitude",
        "serviceArea.center.longitude",
      ],
    );
  });

  it("rejects reversed and malformed availability windows", () => {
    const errors = validateVolunteerProfile({
      ...input,
      availability: [
        { start: "2026-11-21T12:00:00Z", end: "2026-11-21T09:00:00Z" },
        { start: "2026-11-21 09:00", end: "2026-11-21T12:00:00Z" },
      ],
    });
    assert.deepEqual(
      errors.map((error) => error.field),
      ["availability[0]", "availability[1]"],
    );
  });

  it("does not create or edit an invalid profile", () => {
    const invalid = { ...input, transportCapacityKg: Number.NaN };
    assert.equal(createVolunteerProfile(invalid, NOW).profile, null);
    const saved = profile();
    const result = editVolunteerProfile(saved, invalid, NOW);
    assert.equal(result.profile, null);
    assert.equal(result.errors[0]?.field, "transportCapacityKg");
  });
});

describe("volunteer profile save and reload", () => {
  it("keeps identity and verification while replacing editable fields", () => {
    const saved = profile();
    const later = new Date(Date.parse(NOW) + HOUR_MS).toISOString();
    const result = editVolunteerProfile(
      saved,
      {
        displayName: "Meera K.",
        transportMode: "van",
        transportCapacityKg: 60,
        serviceArea: {
          center: { latitude: 13.0216, longitude: 77.5946 },
          radiusKm: 20,
        },
        availability: [],
      },
      later,
    );

    assert.ok(result.profile);
    assert.equal(result.profile.id, saved.id);
    assert.equal(result.profile.verified, true);
    assert.equal(result.profile.createdAt, saved.createdAt);
    assert.equal(Date.parse(result.profile.updatedAt), Date.parse(later));
    assert.equal(result.profile.displayName, "Meera K.");
    assert.equal(result.profile.transportMode, "van");
    assert.equal(result.profile.transportCapacityKg, 60);
    assert.equal(result.profile.serviceArea.radiusKm, 20);
    assert.deepEqual(result.profile.availability, []);
  });
});

describe("volunteer availability", () => {
  it("is inclusive at both window edges and false outside", () => {
    const saved = profile();
    assert.equal(isVolunteerAvailable(saved, "2026-11-21T09:00:00Z"), true);
    assert.equal(isVolunteerAvailable(saved, "2026-11-21T12:00:00Z"), true);
    assert.equal(isVolunteerAvailable(saved, "2026-11-21T08:59:59Z"), false);
    assert.equal(isVolunteerAvailable(saved, "2026-11-21T12:00:01Z"), false);
    assert.equal(isVolunteerAvailable({ ...saved, availability: [] }, NOW), false);
  });
});

describe("mission eligibility", () => {
  it("accepts a verified volunteer covered on capacity, window and area", () => {
    assert.equal(canAcceptMission(profile(), mission), true);
  });

  it("rejects unverified volunteers", () => {
    assert.equal(
      canAcceptMission(profile({ verified: false }), mission),
      false,
    );
  });

  it("allows a mission exactly at capacity but not one kilogram over", () => {
    assert.equal(
      canAcceptMission(profile({ transportCapacityKg: 18 }), mission),
      true,
    );
    assert.equal(
      canAcceptMission(profile({ transportCapacityKg: 17.9 }), mission),
      false,
    );
    assert.equal(
      canAcceptMission(profile(), { ...mission, weightKg: 0 }),
      false,
    );
  });

  it("requires the whole pickup window, not just the reference instant", () => {
    assert.equal(
      canAcceptMission(
        profile({
          availability: [
            { start: "2026-11-21T10:30:00Z", end: "2026-11-21T11:30:00Z" },
          ],
        }),
        mission,
      ),
      false,
    );
    assert.equal(
      canAcceptMission(
        profile({
          availability: [
            { start: "2026-11-21T09:00:00Z", end: "2026-11-21T10:30:00Z" },
            { start: "2026-11-21T10:30:00Z", end: "2026-11-21T12:00:00Z" },
          ],
        }),
        mission,
      ),
      false,
    );
  });

  it("respects the service radius and ignores invalid mission data", () => {
    assert.equal(
      canAcceptMission(
        profile({ serviceArea: { ...profile().serviceArea, radiusKm: 1 } }),
        mission,
      ),
      false,
    );
    assert.equal(
      canAcceptMission(profile(), {
        ...mission,
        pickupWindow: {
          start: "2026-11-21T12:00:00Z",
          end: "2026-11-21T11:00:00Z",
        },
      }),
      false,
    );
  });
});

describe("volunteer capacity in the matching engine", () => {
  const recipient: RecipientRequest = {
    id: "recipient-1",
    location: { latitude: 12.9716, longitude: 77.5946 },
    needs: [],
    requiredServings: 100,
    storage: "ambient",
    ...getMatchingVolunteerFields(profile({ transportCapacityKg: 25 })),
  };
  const donation = {
    id: "donation-1",
    location: { latitude: 12.9716, longitude: 77.5946 },
    categories: ["produce"],
    storage: "ambient" as const,
    totalServings: 100,
    availableServings: 100,
    totalWeightKg: 30,
    pickupDeadlineAt: "2026-11-21T18:00:00Z",
  };

  it("excludes a donation heavier than the volunteer can carry", () => {
    const result = matchDonationsForRecipient(recipient, [donation], {
      now: NOW,
    });
    assert.equal(result.matches.length, 0);
    assert.deepEqual(result.excluded[0]?.reasons, ["transport-capacity"]);
  });

  it("lets the same donation through when the profile capacity is raised", () => {
    const result = matchDonationsForRecipient(
      {
        ...recipient,
        ...getMatchingVolunteerFields(profile({ transportCapacityKg: 40 })),
      },
      [donation],
      { now: NOW },
    );
    assert.equal(result.matches.length, 1);
    assert.equal(result.excluded.length, 0);
  });
});
