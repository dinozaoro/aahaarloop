import type { AiAnalysis, AnalysisStatus, Suggestion } from "./types.ts";
import type { FoodRecognitionProvider } from "./provider.ts";
import type { RateLimiter } from "./rate-limit.ts";

export interface AnalysisStore { save(analysis: AiAnalysis): void; }

export interface AnalyzeDeps {
  provider: FoodRecognitionProvider;
  limiter: RateLimiter;
  store: AnalysisStore;
  timeoutMs?: number; // default 8000
  lowConfidenceThreshold?: number; // default 0.5
  now?: () => Date; // default () => new Date()
  newId?: () => string; // default () => crypto.randomUUID()
}

export interface AnalyzeInput { donationId: string; imageUrl: string; }

// Never throws: every failure is recorded as a "failed" analysis.
export async function analyzeDonationImage(input: AnalyzeInput, deps: AnalyzeDeps): Promise<AiAnalysis> {
  const timeoutMs = deps.timeoutMs ?? 8000;
  const threshold = deps.lowConfidenceThreshold ?? 0.5;
  const now = deps.now ?? (() => new Date());
  const newId = deps.newId ?? (() => crypto.randomUUID());

  const base = {
    id: newId(),
    donationId: input.donationId,
    provider: deps.provider.name,
    model: deps.provider.model,
    source: "ai" as const,
    confirmedByDonor: false,
    createdAt: now().toISOString(),
    confirmation: null,
  };

  const finish = (status: AnalysisStatus, suggestions: Suggestion[]): AiAnalysis => {
    const record: AiAnalysis = { ...base, status, suggestions };
    try {
      deps.store.save(record);
    } catch {
      // A store failure must not break analysis.
    }
    return record;
  };

  if (!deps.limiter.tryAcquire(input.donationId)) return finish("failed", []);

  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("timeout"));
    }, timeoutMs);
  });

  try {
    const pending = deps.provider.recognize({ imageUrl: input.imageUrl }, { signal: controller.signal });
    pending.catch(() => {}); // avoid unhandled rejection after the timeout wins
    const result = await Promise.race([pending, timeout]);
    const suggestions = [...result.suggestions];
    if (suggestions.length === 0) return finish("failed", []);
    const best = Math.max(...suggestions.map((s) => s.confidence));
    return finish(best < threshold ? "low_confidence" : "suggested", suggestions);
  } catch {
    return finish("failed", []);
  } finally {
    clearTimeout(timer);
  }
}

