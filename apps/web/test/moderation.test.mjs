import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import {
  createModerationService,
  toReportView,
} from "../src/lib/moderation/reports.ts";

const NOW = "2026-11-21T12:00:00Z";
const aiAnalysis = {
  id: "ai-1",
  donationId: "d1",
  status: "suggested",
  provider: "sightengine",
  model: "test",
  suggestions: [],
  source: "ai",
  confirmedByDonor: false,
  createdAt: NOW,
  confirmation: null,
  imageAuthenticity: {
    status: "suspicious",
    signal: { provider: "sightengine", score: 0.9, signals: { ai_generated: 0.9 } },
  },
};

function setup() {
  const rows = [];
  const audits = [];
  const repo = {
    all: () => rows,
    find: (id) => rows.find((report) => report.id === id),
    save: (report) => {
      const i = rows.findIndex((item) => item.id === report.id);
      if (i === -1) rows.push(report);
      else rows[i] = report;
    },
  };
  const audit = async (input) => { audits.push(input); };
  const service = createModerationService(repo, audit, {
    now: () => NOW,
    signalSource: (type) => (type === "donation" ? aiAnalysis : undefined),
  });
  return { rows, audits, repo, service };
}

const admin = { id: "admin-1", role: "admin" };

test("a report requires a valid reason and a target", async () => {
  const { service } = setup();
  await assert.rejects(
    () => service.submit({ targetType: "donation", targetId: "d1", reporterId: "u1", reason: "" }),
    /valid reason/,
  );
  await assert.rejects(
    () => service.submit({ targetType: "donation", targetId: "", reporterId: "u1", reason: "spam" }),
    /target is required/,
  );
});

test("submitting then resolving a report applies status and writes an audit entry", async () => {
  const { service, audits } = setup();
  const report = await service.submit({
    targetType: "donation", targetId: "d1", reporterId: "u1", reason: "unsafe_food",
  });
  assert.equal(report.status, "open");
  assert.ok(report.aiAnalysis);

  const resolved = await service.decide(report.id, "resolve", admin, "confirmed unsafe");
  assert.equal(resolved.status, "resolved");
  assert.equal(resolved.decidedBy, "admin-1");
  assert.equal(resolved.decidedAt, NOW);
  assert.equal(resolved.resolutionNote, "confirmed unsafe");
  assert.equal(audits.length, 1);
  assert.equal(audits[0].action, "report.resolved");
  assert.equal(audits[0].entityType, "report");
  assert.equal(audits[0].entityId, report.id);
});

test("dismissing a report is audited separately", async () => {
  const { service, audits } = setup();
  const report = await service.submit({
    targetType: "user", targetId: "u2", reporterId: "u1", reason: "fraudulent",
  });
  const dismissed = await service.decide(report.id, "dismiss", admin);
  assert.equal(dismissed.status, "dismissed");
  assert.equal(audits[0].action, "report.dismissed");
});

test("non-admins cannot moderate and a decided report is final", async () => {
  const { service, audits } = setup();
  const report = await service.submit({
    targetType: "donation", targetId: "d1", reporterId: "u1", reason: "spam",
  });
  await assert.rejects(
    () => service.decide(report.id, "resolve", { id: "u1", role: "reporter" }),
    /Only admins/,
  );
  assert.equal(audits.length, 0);
  await service.decide(report.id, "resolve", admin);
  await assert.rejects(
    () => service.decide(report.id, "dismiss", admin),
    /already been decided/,
  );
});

test("AI authenticity signals are visible to admins only", async () => {
  const { service } = setup();
  const report = await service.submit({
    targetType: "donation", targetId: "d1", reporterId: "u1", reason: "unsafe_food",
  });
  const adminView = toReportView(report, "admin");
  assert.ok(adminView.aiAuthenticity);
  assert.equal(adminView.aiAuthenticity.status, "suspicious");
  assert.ok(adminView.aiAnalysis.imageAuthenticity);

  for (const viewer of ["reporter", "public"]) {
    const view = toReportView(report, viewer);
    assert.equal(view.aiAuthenticity, null);
    assert.equal(view.aiAnalysis.imageAuthenticity, undefined);
    assert.equal(view.aiAnalysis.suggestions.length, 0);
  }
});

test("list scopes reports to the reporter unless the viewer is an admin", async () => {
  const { service } = setup();
  await service.submit({ targetType: "donation", targetId: "d1", reporterId: "u1", reason: "spam" });
  await service.submit({ targetType: "donation", targetId: "d2", reporterId: "u2", reason: "spam" });
  assert.equal(service.list("reporter", "u1").length, 1);
  assert.equal(service.list("admin").length, 2);
});

test("the moderation routes enforce the admin role", async () => {
  for (const file of [
    "../src/app/api/admin/reports/route.ts",
    "../src/app/api/admin/reports/[id]/[decision]/route.ts",
  ]) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    assert.match(source, /forbidUnlessRole\(\["admin"\]\)/, file);
  }
  const submit = await readFile(new URL("../src/app/api/reports/route.ts", import.meta.url), "utf8");
  assert.match(submit, /session\.user\.id/);
});
