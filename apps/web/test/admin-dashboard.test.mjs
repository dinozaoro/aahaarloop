import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { applyAdminAction } from "../src/lib/admin/actions.ts";
import {
  adminSummary,
  queryResource,
  resourceDetail,
} from "../src/lib/admin/data.ts";

const rows = [
  { id: "d1", title: "Rice bowl", status: "published", category: "prepared", pickupArea: "Indiranagar" },
  { id: "d2", title: "Bread basket", status: "draft", category: "bakery", pickupArea: "Koramangala" },
  { id: "d3", title: "Rice bran", status: "published", category: "pantry", pickupArea: "Jayanagar" },
];

test("admin tables search across the resource's fields", () => {
  assert.deepEqual(
    queryResource("donations", rows, { search: "rice", page: 1, pageSize: 20 }).data.map((r) => r.id),
    ["d1", "d3"],
  );
  assert.deepEqual(
    queryResource("donations", rows, { search: "indiranagar", page: 1, pageSize: 20 }).data.map((r) => r.id),
    ["d1"],
  );
});

test("status filters and pagination are applied and clamped", () => {
  const filtered = queryResource("donations", rows, {
    status: "published",
    page: 2,
    pageSize: 1,
  });
  assert.equal(filtered.total, 2);
  assert.equal(filtered.page, 2);
  assert.equal(filtered.pageSize, 1);
  assert.deepEqual(filtered.data.map((r) => r.id), ["d3"]);

  const clamped = queryResource("donations", rows, { page: 0, pageSize: 999 });
  assert.equal(clamped.page, 1);
  assert.equal(clamped.pageSize, 100);
});

test("detail lookup fails for unknown ids", () => {
  assert.equal(resourceDetail(rows, "d1").title, "Rice bowl");
  assert.throws(() => resourceDetail(rows, "missing"), /NOT_FOUND/);
  assert.deepEqual(
    adminSummary({ users: 4, organizations: 3, donations: 9, claims: 2, missions: 1 }),
    { users: 4, organizations: 3, donations: 9, claims: 2, missions: 1 },
  );
});

function actionRepo() {
  const state = {
    donation: { id: "d1", status: "published", title: "Rice" },
    organization: { id: "o1", name: "Kitchen", verified: false },
    audits: [],
  };
  const repo = {
    findDonation: () => state.donation,
    saveDonation: (value) => { state.donation = value; },
    findOrganization: () => state.organization,
    saveOrganization: (value) => { state.organization = value; },
    findClaim: () => undefined,
    audit: (input) => { state.audits.push(input); },
  };
  return { state, repo };
}

test("unpublishing a donation is applied and audited", () => {
  const { state, repo } = actionRepo();
  const result = applyAdminAction(repo, {
    action: "unpublish_donation",
    entityType: "donation",
    entityId: "d1",
    actorId: "admin-1",
  });
  assert.equal(result.status, "draft");
  assert.equal(state.donation.status, "draft");
  assert.equal(state.audits.length, 1);
  assert.equal(state.audits[0].action, "admin.donation.unpublish");
  assert.equal(state.audits[0].actorId, "admin-1");
});

test("verifying an organization is applied and audited", () => {
  const { state, repo } = actionRepo();
  applyAdminAction(repo, {
    action: "verify_organization",
    entityType: "organization",
    entityId: "o1",
    actorId: "admin-1",
  });
  assert.equal(state.organization.verified, true);
  assert.equal(state.audits[0].action, "admin.organization.verify");
});

test("mismatched entity types and unknown actions are rejected without audit", () => {
  const { state, repo } = actionRepo();
  assert.throws(
    () => applyAdminAction(repo, {
      action: "unpublish_donation",
      entityType: "organization",
      entityId: "o1",
      actorId: "admin-1",
    }),
    /requires a donation/,
  );
  assert.throws(
    () => applyAdminAction(repo, {
      action: "unknown",
      entityType: "donation",
      entityId: "d1",
      actorId: "admin-1",
    }),
    /Unknown admin action/,
  );
  assert.equal(state.audits.length, 0);
});

test("the whole admin area is admin-guarded", async () => {
  const page = await readFile(new URL("../src/app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(page, /requireAdmin\(\)/);
  for (const file of [
    "../src/app/api/admin/[resource]/route.ts",
    "../src/app/api/admin/[resource]/[id]/route.ts",
    "../src/app/api/admin/actions/route.ts",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /forbidUnlessRole\(\["admin"\]\)/, file);
  }
});
