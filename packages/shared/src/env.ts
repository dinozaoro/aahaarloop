import { z } from "zod";

export function parseEnv<S extends z.ZodType>(
  schema: S,
  env: Record<string, string | undefined>,
): z.output<S> {
  const parsed = schema.safeParse(env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment variables: ${issues}`);
  }
  return parsed.data;
}
