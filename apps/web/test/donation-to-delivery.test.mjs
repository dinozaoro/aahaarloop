import assert from "node:assert/strict";
import test from "node:test";

import { createClaimService } from "../src/lib/claims/transaction.ts";
import { createDonationService } from "../src/lib/donations/service.ts";
import { createPickupService } from "../src/lib/pickups/tasks.ts";

const NOW = "2026-11-21T12:00:00Z";
const location = { latitude: 12.9716, longitude: 77.5946 };

/** In-memory adapters shared by all three services for one full flow. */
function setup() {
  const state = {
    donations: [],
    claims: [],
    tasks: [],
    assignments: [],
    events: [],
  };
  const donationRepo = {
    all: () => state.donations,
    find: (id) => state.donations.find((item) => item.id === id),
    save: (value) => {
      const index = state.donations.findIndex((item) => item.id === value.id);
      if (index === -1) state.donations.push(value);
      else state.donations[index] = value;
    },
  };
  const claimRepo = {
    findDonation: donationRepo.find,
    findByIdempotencyKey: (key) =>
      state.claims.find((claim) => claim.idempotencyKey === key),
    saveDonation: donationRepo.save,
    saveClaim: (value) => state.claims.push(value),
    appendEvent: (_id, type, actor) => state.events.push({ type, actor }),
  };
  const pickupRepo = {
    tasks: () => state.tasks,
    assignments: () => state.assignments,
    saveTask: (task) => {
      const index = state.tasks.findIndex((item) => item.id === task.id);
      if (index === -1) state.tasks.push(task);
      else state.tasks[index] = task;
    },
    saveAssignment: (assignment) => {
      const index = state.assignments.findIndex(
        (item) => item.id === assignment.id,
      );
      if (index === -1) state.assignments.push(assignment);
      else state.assignments[index] = assignment;
    },
    findVolunteer: () => ({
      id: "v1",
      displayName: "Ravi",
      transportMode: "bicycle",
      transportCapacityKg: 10,
      serviceArea: { center: location, radiusKm: 5 },
      verified: true,
      availability: [{ start: NOW, end: "2026-11-23T00:00:00Z" }],
      createdAt: NOW,
      updatedAt: NOW,
    }),
    audit: (taskId, action, actorId) =>
      state.events.push({ taskId, action, actorId }),
  };

  return {
    state,
    donations: createDonationService(donationRepo, () => NOW),
    claims: createClaimService(claimRepo, () => NOW),
    pickups: createPickupService(pickupRepo, () => NOW),
  };
}

test("a donation travels from draft to a completed volunteer pickup without losing quantity", async () => {
  const { state, donations, claims, pickups } = setup();

  const draft = donations.create(
    {
      title: "Vegetable biryani",
      description: "Cooked this morning",
      items: [
        {
          name: "Biryani",
          category: "prepared",
          quantity: 20,
          unit: "serving",
          storage: "chilled",
          dietary_flags: [],
          allergens: [],
        },
      ],
      total_servings: 20,
      food_expiry_at: "2026-11-23T10:00:00Z",
      pickup_deadline_at: "2026-11-22T18:00:00Z",
      pickup_location: {
        label: "Indiranagar",
        address: "12 MG Road",
        point: location,
      },
    },
    "org-donor",
    "user-donor",
  );
  assert.equal(draft.status, "draft");

  const published = donations.publish(draft.id, "org-donor", "user-donor");
  assert.equal(published.status, "published");

  // The demo store has no volumetric input; weight is filled before pickup.
  state.donations[0] = { ...state.donations[0], weightKg: 10 };

  const claim = await claims.create({
    donationId: published.id,
    recipientOrgId: "org-recipient",
    servings: 6,
    actorId: "user-recipient",
    idempotencyKey: "e2e-claim-1",
  });
  assert.equal(claim.servings, 6);
  assert.equal(state.donations[0].servingsAvailable, 14);
  assert.equal(state.donations[0].status, "published");

  const task = pickups.generateForClaim(claim, state.donations[0]);
  assert.equal(task.status, "unassigned");

  pickups.assign(task.id, "v1", "user-admin");
  assert.equal(state.tasks[0].status, "assigned");

  const completed = pickups.complete(task.id, "v1");
  assert.equal(completed.status, "completed");
  assert.equal(state.assignments[0].status, "completed");
  assert.deepEqual(
    state.events.map((event) => event.type ?? event.action).filter(Boolean),
    [
      "claimed",
      "pickup.task.created",
      "pickup.task.assigned",
      "pickup.task.completed",
    ],
  );
  assert.deepEqual(
    state.donations[0].events.map((event) => event.type),
    ["created", "published"],
  );
});
