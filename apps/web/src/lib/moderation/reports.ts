import { ApiError } from "../api/errors.ts";

/** Structural subset of the Sightengine analysis stored by food-recognition. */
export interface AiAnalysis {
  id: string;
  donationId: string;
  status: string;
  provider: string;
  model: string;
  source: "ai";
  suggestions: Array<{ category: string; name: string; confidence: number }>;
  confirmedByDonor: boolean;
  createdAt: string;
  confirmation: unknown;
  imageAuthenticity?: {
    status: "clean" | "suspicious" | "unavailable";
    signal: { provider: string; score: number; signals: Record<string, number> } | null;
  };
}

function withoutAuthenticity(analysis: AiAnalysis): AiAnalysis {
  const copy = { ...analysis };
  delete copy.imageAuthenticity;
  return copy;
}

export const REPORT_REASONS = [
  "unsafe_food",
  "fraudulent",
  "spam",
  "inappropriate",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportStatus = "open" | "resolved" | "dismissed";
export type ReportTargetType = "donation" | "user";

export interface ModerationReport {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  aiAnalysis?: AiAnalysis;
  createdAt: string;
  decidedAt: string | null;
  decidedBy: string | null;
  resolutionNote?: string;
}

export interface SubmitReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reporterId: string;
  reason: ReportReason;
  details?: string;
}

export interface ModerationActor {
  id: string;
  role: "donor" | "recipient" | "volunteer" | "admin";
}

export interface ModerationRepository {
  all(): readonly ModerationReport[];
  find(id: string): ModerationReport | undefined;
  save(report: ModerationReport): void;
}

export type ModerationAudit = (input: {
  action: string;
  actorId: string;
  entityType: string;
  entityId: string;
  after: unknown;
}) => Promise<void>;

/** Server-side lookup; report submitters cannot inject their own AI signals. */
export type SignalSource = (
  targetType: ReportTargetType,
  targetId: string,
) => AiAnalysis | undefined;

export interface ModerationOptions {
  now?: () => string;
  signalSource?: SignalSource;
}

/** Public projection: AI authenticity is stripped for everyone but admins. */
export function toReportView(
  report: ModerationReport,
  viewer: "admin" | "reporter" | "public",
) {
  const isAdmin = viewer === "admin";
  const analysis = report.aiAnalysis
    ? isAdmin
      ? report.aiAnalysis
      : withoutAuthenticity(report.aiAnalysis)
    : null;
  return {
    ...report,
    aiAnalysis: analysis,
    aiAuthenticity: isAdmin ? (analysis?.imageAuthenticity ?? null) : null,
  };
}

export function createModerationService(
  repo: ModerationRepository,
  audit: ModerationAudit,
  options: ModerationOptions = {},
) {
  const now = options.now ?? (() => new Date().toISOString());
  const signalSource = options.signalSource;

  return {
    async submit(input: SubmitReportInput): Promise<ModerationReport> {
      if (!REPORT_REASONS.includes(input.reason)) {
        throw new ApiError("validation_error", "A valid reason is required");
      }
      if (!input.targetId?.trim()) {
        throw new ApiError("validation_error", "A target is required");
      }
      const aiAnalysis = signalSource?.(input.targetType, input.targetId);
      const report: ModerationReport = {
        id: crypto.randomUUID(),
        targetType: input.targetType,
        targetId: input.targetId,
        reporterId: input.reporterId,
        reason: input.reason,
        ...(input.details ? { details: input.details } : {}),
        status: "open",
        ...(aiAnalysis ? { aiAnalysis } : {}),
        createdAt: now(),
        decidedAt: null,
        decidedBy: null,
      };
      repo.save(report);
      return report;
    },

    list(viewer: "admin" | "reporter" | "public", reporterId?: string) {
      return repo
        .all()
        .filter((report) => viewer === "admin" || report.reporterId === reporterId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map((report) => toReportView(report, viewer));
    },

    async decide(
      id: string,
      decision: "resolve" | "dismiss",
      actor: ModerationActor,
      note?: string,
    ): Promise<ModerationReport> {
      if (actor.role !== "admin") {
        throw new ApiError("forbidden", "Only admins can moderate reports");
      }
      const report = repo.find(id);
      if (!report) throw new ApiError("not_found", "Report not found");
      if (report.status !== "open") {
        throw new ApiError("conflict", "Report has already been decided");
      }
      const status: ReportStatus = decision === "resolve" ? "resolved" : "dismissed";
      const updated: ModerationReport = {
        ...report,
        status,
        decidedAt: now(),
        decidedBy: actor.id,
        ...(note ? { resolutionNote: note } : {}),
      };
      repo.save(updated);
      await audit({
        action: `report.${status}`,
        actorId: actor.id,
        entityType: "report",
        entityId: id,
        after: { status, resolutionNote: note ?? null },
      });
      return updated;
    },
  };
}
