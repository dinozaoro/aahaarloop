import assert from "node:assert/strict";
import test from "node:test";

import { createClaimService } from "../src/lib/claims/transaction.ts";
import { createDeliveryService } from "../src/lib/delivery/service.ts";
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
    impacts: [],
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

  const deliveryRepo = {
    findTask: (id) => state.tasks.find((task) => task.id === id),
    findAssignment: (taskId, volunteerId) =>
      state.assignments.find(
        (item) => item.taskId === taskId && item.volunteerId === volunteerId,
      ),
    findClaim: (id) => state.claims.find((claim) => claim.id === id),
    findDonation: (id) => state.donations.find((item) => item.id === id),
    saveTask: pickupRepo.saveTask,
    saveAssignment: pickupRepo.saveAssignment,
    saveClaim: (claim) => {
      const index = state.claims.findIndex((item) => item.id === claim.id);
      if (index === -1) state.claims.push(claim);
      else state.claims[index] = claim;
    },
    saveDonation: donationRepo.save,
    saveImpact: (record) => state.impacts.push(record),
  };

  return {
    state,
    donations: createDonationService(donationRepo, () => NOW),
    claims: createClaimService(claimRepo, () => NOW),
    pickups: createPickupService(pickupRepo, () => NOW),
    delivery: createDeliveryService(deliveryRepo, () => NOW),
  };
}

test("a donation travels from draft to a completed volunteer pickup without losing quantity", async () => {
  const { state, donations, claims, pickups, delivery } = setup();

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

  const delivered = delivery.confirm({
    taskId: task.id,
    volunteerId: "v1",
    proof: { type: "signature", value: "recipient signature" },
    deliveredQuantity: claim.servings,
  });
  assert.equal(delivered.claim.status, "delivered");
  assert.equal(delivered.donation.status, "delivered");
  assert.equal(state.impacts.length, 1);
  assert.equal(state.impacts[0].value, claim.servings);
  assert.equal(state.assignments[0].status, "completed");
  assert.equal(delivered.task.status, "completed");
  assert.deepEqual(
    state.events.map((event) => event.type ?? event.action).filter(Boolean),
    ["claimed", "pickup.task.created", "pickup.task.assigned"],
  );
  assert.deepEqual(
    state.donations[0].events.map((event) => event.type),
    ["created", "published", "delivered"],
  );
});
