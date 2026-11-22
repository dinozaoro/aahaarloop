import {
  createModerationService,
  type ModerationReport,
  type ModerationRepository,
} from "./reports.ts";

const rows: ModerationReport[] = [];
const auditTrail: Array<Record<string, unknown>> = [];

const repository: ModerationRepository = {
  all: () => rows,
  find: (id) => rows.find((report) => report.id === id),
  save: (report) => {
    const index = rows.findIndex((item) => item.id === report.id);
    if (index === -1) rows.push(report);
    else rows[index] = report;
  },
};

export const moderationService = createModerationService(
  repository,
  async (input) => {
    auditTrail.push({ ...input, at: new Date().toISOString() });
  },
);
export const moderationReports = rows;
export const moderationAuditTrail = auditTrail;
