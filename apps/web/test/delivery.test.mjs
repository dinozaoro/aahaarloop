import assert from "node:assert/strict";
import test from "node:test";

import { createDeliveryService } from "../src/lib/delivery/service.ts";

const NOW = "2026-11-21T16:00:00Z";
const location = { latitude: 12.97, longitude: 77.59 };

function setup() {
  const state = {
    task: {
      id: "t1",
      donationId: "d1",
      claimId: "c1",
      status: "in_progress",
      windowStart: NOW,
      windowEnd: "2026-11-22T18:00:00Z",
      address: "12 MG Road",
      location,
      weightKg: 6,
      createdAt: NOW,
    },
    assignment: {
      id: "a1",
      taskId: "t1",
      volunteerId: "v1",
      status: "accepted",
      assignedAt: NOW,
    },
    claim: {
      id: "c1",
      donationId: "d1",
      donationTitle: "Rice",
      donorOrganizationId: "org-donor",
      recipientOrgId: "org-recipient",
      recipientName: "Hope Shelter",
      servings: 6,
      weightKg: 6,
      status: "pickup_scheduled",
      createdAt: NOW,
      updatedAt: NOW,
      history: [],
    },
    donation: {
      id: "d1",
      organizationId: "org-donor",
      title: "Rice",
      description: "",
      category: "prepared",
      storage: "chilled",
      servingsTotal: 10,
      servingsAvailable: 4,
      weightKg: 10,
      allergens: [],
      dietTags: [],
      packaging: "",
      pickupAddress: "12 MG Road",
      pickupArea: "Bengaluru",
      location,
      foodExpiryAt: "2026-11-23T00:00:00Z",
      bestBeforeAt: "",
      pickupDeadlineAt: "2026-11-22T18:00:00Z",
      status: "pickup_scheduled",
      createdAt: NOW,
      updatedAt: NOW,
      events: [],
    },
    impacts: [],
  };
  const repo = {
    findTask: () => state.task,
    findAssignment: (taskId, volunteerId) =>
      taskId === state.assignment.taskId &&
      volunteerId === state.assignment.volunteerId
        ? state.assignment
        : undefined,
    findClaim: () => state.claim,
    findDonation: () => state.donation,
    saveTask: (task) => {
      state.task = task;
    },
    saveAssignment: (assignment) => {
      state.assignment = assignment;
    },
    saveClaim: (claim) => {
      state.claim = claim;
    },
    saveDonation: (donation) => {
      state.donation = donation;
    },
    saveImpact: (record) => {
      state.impacts.push(record);
    },
  };
  return { state, service: createDeliveryService(repo, () => NOW) };
}

const command = (overrides = {}) => ({
  taskId: "t1",
  volunteerId: "v1",
  proof: { type: "signature", value: "recipient signature" },
  deliveredQuantity: 6,
  ...overrides,
});

test("delivery requires real proof", () => {
  const { service, state } = setup();
  assert.throws(
    () => service.confirm(command({ proof: { type: "photo", value: "  " } })),
    /proof of delivery is required/,
  );
  assert.equal(state.impacts.length, 0);
});

test("a confirmed delivery completes task, claim, donation and impact", () => {
  const { service, state } = setup();
  const result = service.confirm(command());

  assert.equal(result.task.status, "completed");
  assert.equal(result.claim.status, "delivered");
  assert.equal(result.donation.status, "delivered");
  assert.equal(state.assignment.status, "completed");
  assert.equal(state.impacts.length, 1);
  assert.deepEqual(
    {
      metric: state.impacts[0].metric,
      value: state.impacts[0].value,
      discrepancy: state.impacts[0].discrepancy,
      proofType: state.impacts[0].proofType,
    },
    {
      metric: "servings_rescued",
      value: 6,
      discrepancy: 0,
      proofType: "signature",
    },
  );
  assert.equal(result.claim.history.at(-1).type, "delivered");
});

test("a quantity mismatch is recorded with its note", () => {
  const { service, state } = setup();
  const result = service.confirm(
    command({ deliveredQuantity: 5, discrepancyNote: "one portion spoiled" }),
  );
  assert.equal(result.impact.discrepancy, 1);
  assert.equal(result.impact.note, "one portion spoiled");
  assert.equal(result.claim.history.at(-1).note, "one portion spoiled");
});

test("only the assigned volunteer can confirm and only once", () => {
  const { service } = setup();
  assert.throws(
    () => service.confirm(command({ volunteerId: "someone-else" })),
    /only the assigned volunteer/i,
  );
  service.confirm(command());
  assert.throws(() => service.confirm(command()), /not awaiting delivery/);
});
