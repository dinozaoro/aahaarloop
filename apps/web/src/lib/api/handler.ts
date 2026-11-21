import { ZodError, type ZodType } from "zod";

import {
  ApiError,
  errorResponse,
  toErrorResponse,
  type ApiErrorCode,
} from "./errors.ts";
import {
  createIdempotencyStore,
  type IdempotencyStore,
} from "./idempotency.ts";
import type { RateLimitHook } from "./rate-limit.ts";
import {
  isCrossOriginRequest,
  isUnsafeMethod,
} from "../security/csrf.ts";

export interface ApiContext {
  requestId: string;
  request: Request;
}

export interface HandlerInput<TBody, TQuery> {
  body: TBody;
  query: TQuery;
}

export type ApiHandler<TBody, TQuery> = (
  input: HandlerInput<TBody, TQuery>,
  context: ApiContext,
) => Promise<Response> | Response;

export interface HandlerOptions<TBody, TQuery> {
  bodySchema?: ZodType<TBody>;
  querySchema?: ZodType<TQuery>;
  /** Presence enables POST replay; defaults to an in-memory store. */
  idempotency?: IdempotencyStore | true;
  rateLimit?: RateLimitHook;
  log?: (entry: Record<string, unknown>) => void;
}

const defaultLog = (entry: Record<string, unknown>) => {
  console.info(JSON.stringify(entry));
};

export function withApiHandler<TBody = unknown, TQuery = unknown>(
  options: HandlerOptions<TBody, TQuery> = {},
  handler: ApiHandler<TBody, TQuery>,
): (request: Request) => Promise<Response> {
  const store =
    options.idempotency === true
      ? createIdempotencyStore()
      : options.idempotency;
  const log = options.log ?? defaultLog;

  return async (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    const started = Date.now();
    const { pathname } = new URL(request.url);
    let code: ApiErrorCode | "ok" = "ok";
    let status = 500;

    const finish = (response: Response, errorCode?: ApiErrorCode): Response => {
      const withId = new Response(response.body, {
        status: response.status,
        headers: new Headers(response.headers),
      });
      withId.headers.set("x-request-id", requestId);
      status = response.status;
      if (errorCode) code = errorCode;
      log({
        request_id: requestId,
        method: request.method,
        path: pathname,
        status,
        code,
        duration_ms: Date.now() - started,
      });
      return withId;
    };

    try {
      if (isUnsafeMethod(request.method) && isCrossOriginRequest(request)) {
        return finish(
          errorResponse("forbidden", "Cross-origin request rejected", requestId),
          "forbidden",
        );
      }

      if (options.rateLimit) {
        const client =
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          "local";
        if (!options.rateLimit.tryAcquire(`${client}:${pathname}`)) {
          return finish(
            errorResponse("rate_limited", "Too many requests", requestId),
            "rate_limited",
          );
        }
      }

      const idempotencyKey =
        request.method === "POST"
          ? request.headers.get("idempotency-key")
          : null;
      if (store && idempotencyKey) {
        const hit = store.get(idempotencyKey);
        if (hit) {
          return finish(
            new Response(hit.bodyText, {
              status: hit.status,
              headers: {
                "content-type": hit.contentType ?? "application/json",
              },
            }),
          );
        }
      }

      let body: TBody;
      if (options.bodySchema) {
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          throw new ApiError("validation_error", "Invalid JSON body");
        }
        const parsed = options.bodySchema.safeParse(json);
        if (!parsed.success) {
          return finish(
            toErrorResponse(parsed.error, requestId),
            "validation_error",
          );
        }
        body = parsed.data;
      } else {
        body = undefined as TBody;
      }

      const searchParams = new URL(request.url).searchParams;
      let query: TQuery;
      if (options.querySchema) {
        const parsed = options.querySchema.safeParse(
          Object.fromEntries(searchParams),
        );
        if (!parsed.success) {
          return finish(
            toErrorResponse(parsed.error, requestId),
            "validation_error",
          );
        }
        query = parsed.data;
      } else {
        query = searchParams as unknown as TQuery;
      }

      const response = await handler({ body, query }, { requestId, request });
      if (store && idempotencyKey && response.ok) {
        store.set(idempotencyKey, {
          status: response.status,
          bodyText: await response.clone().text(),
          contentType: response.headers.get("content-type"),
        });
      }
      return finish(response);
    } catch (error) {
      const errorCode =
        error instanceof ApiError
          ? error.code
          : error instanceof ZodError
            ? "validation_error"
            : "internal_error";
      return finish(toErrorResponse(error, requestId), errorCode);
    }
  };
}
