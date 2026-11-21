import { z } from "zod";

/** Neon injects only these two Gateway variables, never OPENAI_*. */
const gatewayEnvSchema = z.object({
  NEON_AI_GATEWAY_BASE_URL: z.string().url(),
  NEON_AI_GATEWAY_TOKEN: z.string().min(1),
});

export interface GatewayConfig {
  baseUrl: string;
  token: string;
}

export interface GatewayModel {
  id: string;
  enabled: boolean;
  owned_by?: string;
  unavailable_reason?: string;
  recovery_url?: string;
}

export function getGatewayConfig(): GatewayConfig {
  const parsed = gatewayEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(
      "Neon AI Gateway is not configured: NEON_AI_GATEWAY_BASE_URL and NEON_AI_GATEWAY_TOKEN are required",
    );
  }
  return {
    baseUrl: parsed.data.NEON_AI_GATEWAY_BASE_URL.replace(/\/+$/, ""),
    token: parsed.data.NEON_AI_GATEWAY_TOKEN,
  };
}

/** Bare host + OpenAI-compatible chat-completions dialect. */
export async function gatewayFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { baseUrl, token } = getGatewayConfig();
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
}

export async function listGatewayModels(): Promise<GatewayModel[]> {
  const response = await gatewayFetch("/v1/models");
  if (!response.ok) {
    throw new Error(`AI Gateway /v1/models returned ${response.status}`);
  }
  const body = (await response.json()) as { data?: GatewayModel[] };
  return body.data ?? [];
}

export async function chatCompletion(
  model: string,
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
): Promise<string> {
  const response = await gatewayFetch("/v1/chat/completions", {
    method: "POST",
    body: JSON.stringify({ model, messages }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `AI Gateway chat completion returned ${response.status}: ${detail.slice(0, 300)}`,
    );
  }
  const body = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return body.choices?.[0]?.message?.content ?? "";
}
