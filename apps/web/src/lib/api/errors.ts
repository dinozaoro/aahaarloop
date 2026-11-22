import { ZodError } from "zod";

export const API_ERROR_CODES = [
  "validation_error",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "rate_limited",
  "internal_error",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

const STATUS: Record<ApiErrorCode, number> = {
  validation_error: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  rate_limited: 429,
  internal_error: 500,
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.details = details;
  }
}

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    request_id: string;
    details?: unknown;
  };
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  requestId: string,
  details?: unknown,
): Response {
  const body: ApiErrorBody = {
    error: { code, message, request_id: requestId },
  };
  if (details !== undefined) body.error.details = details;
  return Response.json(body, { status: STATUS[code] });
}

/** Zod field paths are safe to return; raw values are never included. */
function zodDetails(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
    code: issue.code,
  }));
}

export function toErrorResponse(error: unknown, requestId: string): Response {
  if (error instanceof ZodError) {
    return errorResponse(
      "validation_error",
      "Validation failed",
      requestId,
      zodDetails(error),
    );
  }
  if (error instanceof ApiError) {
    return errorResponse(error.code, error.message, requestId, error.details);
  }
  // Unknown errors may contain credentials or internals: never expose them.
  return errorResponse("internal_error", "Internal server error", requestId);
}
