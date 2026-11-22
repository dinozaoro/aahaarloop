import assert from "node:assert/strict";
import { test } from "node:test";

import { createPickupService } from "../src/lib/pickups/tasks.ts";

const location = { latitude: 12.9716, longitude: 77.5946 };
const donation = {
  id: "d1", organizationId: "org-donor", title: "Rice", description: "",
  category: "prepared", storage: "chilled", servingsTotal: 10, servingsAvailable: 4,
  weightKg: 10, allergens: [], dietTags: [], packaging: "", pickupAddress: "2 MG Road",
  pickupArea: "Bengaluru", location, foodExpiryAt: "2026-11-23T12:00:00Z",
  bestBeforeAt: "", pickupDeadlineAt: "2026-11-22T12:00:00Z", status: "claimed",
  createdAt: "2026-11-21T12:00:00Z", updatedAt: "2026-11-21T12:00:00Z", events: [],
};
const claim = {
  id: "c1", donationId: "d1", donationTitle: "Rice", donorOrganizationId: "org-donor",
  recipientOrgId: "org-recipient", servings: 6, weightKg: 6, status: "confirmed",
  createdAt: "2026-11-21T12:00:00Z", updatedAt: "2026-11-21T12:00:00Z", history: [],
};
const volunteer = (overrides = {}) => ({
  id: "v1", displayName: "Ravi", transportMode: "bicycle", transportCapacityKg: 10,
  serviceArea: { center: location, radiusKm: 5 }, verified: true,
  availability: [{ start: "2026-11-21T12:00:00Z", end: "2026-11-22T12:00:00Z" }],
  createdAt: "2026-11-21T12:00:00Z", updatedAt: "2026-11-21T12:00:00Z",
  ...overrides,
});

function setup(profile = volunteer()) {
  const state = { tasks: [], assignments: [], trail: [], volunteer: profile };
  const repo = {
    tasks: () => state.tasks,
    assignments: () => state.assignments,
    saveTask: (task) => {
      const i = state.tasks.findIndex((item) => item.id === task.id);
      if (i === -1) state.tasks.push(task); else state.tasks[i] = task;
    },
    saveAssignment: (assignment) => {
      const i = state.assignments.findIndex((item) => item.id === assignment.id);
      if (i === -1) state.assignments.push(assignment); else state.assignments[i] = assignment;
    },
    findVolunteer: (id) => (state.volunteer.id === id ? state.volunteer : undefined),
    audit: (taskId, action, actorId) => state.trail.push({ taskId, action, actorId }),
  };
  return { state, service: createPickupService(repo, () => "2026-11-21T12:00:00Z") };
}

test("one task is generated per claim requiring pickup", async () => {
  const { state, service } = setup();
  const task = await service.generateForClaim(claim, donation);
  assert.equal(state.tasks.length, 1);
  assert.equal((await service.generateForClaim(claim, donation)).id, task.id);
  assert.equal(state.trail[0].action, "pickup.task.created");
});

test("assignment honours capacity, distance and availability", async () => {
  const { service } = setup();
  const task = await service.generateForClaim(claim, donation);
  assert.equal((await service.assign(task.id, "v1", "admin-1")).status, "assigned");

  const tooSmall = setup(volunteer({ id: "v2", transportCapacityKg: 2 }));
  const smallTask = await tooSmall.service.generateForClaim(claim, donation);
  await assert.rejects(
    () => tooSmall.service.assign(smallTask.id, "v2", "admin"),
    /capacity or availability/,
  );
  const tooFar = setup(volunteer({
    id: "v3",
    serviceArea: { center: { latitude: 13.5, longitude: 78.5 }, radiusKm: 1 },
  }));
  const farTask = await tooFar.service.generateForClaim(claim, donation);
  await assert.rejects(
    () => tooFar.service.assign(farTask.id, "v3", "admin"),
    /service area|capacity or availability/,
  );
});

test("double assignment is rejected and status changes are audited", async () => {
  const { state, service } = setup();
  const task = await service.generateForClaim(claim, donation);
  await service.assign(task.id, "v1", "admin-1");
  await assert.rejects(() => service.assign(task.id, "v1", "admin-2"), /already assigned/);
  assert.equal((await service.complete(task.id, "v1")).status, "completed");
  assert.deepEqual(state.trail.map((entry) => entry.action), [
    "pickup.task.created",
    "pickup.task.assigned",
    "pickup.task.completed",
  ]);
});
