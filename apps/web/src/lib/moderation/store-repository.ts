import {
  createModerationService,
  type AiAnalysis,
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

// Demo signal: a deterministic authenticity snapshot for reported donations.
// Production replaces this with the stored Sightengine analysis for the image.
function demoSignal(targetType: string, targetId: string): AiAnalysis | undefined {
  if (targetType !== "donation") return undefined;
  return {
    id: `ai-${targetId}`,
    donationId: targetId,
    status: "suggested",
    provider: "sightengine",
    model: "demo",
    suggestions: [],
    source: "ai",
    confirmedByDonor: false,
    createdAt: new Date(0).toISOString(),
    confirmation: null,
    imageAuthenticity: {
      status: "suspicious",
      signal: {
        provider: "sightengine",
        score: 0.72,
        signals: { ai_generated: 0.72 },
      },
    },
  };
}

export const moderationService = createModerationService(
  repository,
  async (input) => {
    auditTrail.push({ ...input, at: new Date().toISOString() });
  },
  { signalSource: demoSignal },
);
export const moderationReports = rows;
export const moderationAuditTrail = auditTrail;
