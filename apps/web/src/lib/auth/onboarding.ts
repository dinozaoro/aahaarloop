export const USER_ROLES = ["donor", "recipient", "volunteer", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Admin is never offered during self-service onboarding. */
export const SELF_ASSIGNABLE_ROLES = [
  "donor",
  "recipient",
  "volunteer",
] as const;
export type SelfAssignableRole = (typeof SELF_ASSIGNABLE_ROLES)[number];

export function isUserRole(value: unknown): value is UserRole {
  return (
    typeof value === "string" &&
    (USER_ROLES as readonly string[]).includes(value)
  );
}

export function isSelfAssignableRole(
  value: unknown,
): value is SelfAssignableRole {
  return (
    typeof value === "string" &&
    (SELF_ASSIGNABLE_ROLES as readonly string[]).includes(value)
  );
}

export function parseOnboardingRole(value: unknown): SelfAssignableRole {
  if (!isSelfAssignableRole(value)) {
    throw new Error("Choose donor, recipient or volunteer.");
  }
  return value;
}

export function organizationTypeForRole(role: SelfAssignableRole) {
  return role;
}

export function parseOrganizationMode(value: unknown): "create" | "join" {
  if (value === "join") return "join";
  if (
    value === "create" ||
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "create";
  }
  throw new Error("Choose create or join.");
}

export function validateOrganizationName(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Organization name is required.");
  const name = value.trim();
  if (name.length < 2 || name.length > 120) {
    throw new Error("Organization name must be 2 to 120 characters.");
  }
  return name;
}

export function organizationNameOrDefault(value: unknown): string {
  if (typeof value === "string" && value.trim() === "") {
    return "My organization";
  }
  if (value === null || value === undefined) return "My organization";
  return validateOrganizationName(value);
}

export function validateJoinSlug(value: unknown): string {
  if (typeof value !== "string")
    throw new Error("Organization slug is required.");
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error("Invalid organization slug.");
  }
  return slug;
}

export function slugifyOrganizationName(name: string): string {
  const slug = name
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "organization";
}

export function uniqueOrganizationSlug(
  name: string,
  taken: readonly string[],
): string {
  const base = slugifyOrganizationName(name);
  if (!taken.includes(base)) return base;
  let suffix = 2;
  while (taken.includes(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

/** Normalizes JWT claims into the shape exposed on the session. */
export function sessionUserFromClaims(claims: {
  id?: unknown;
  role?: unknown;
  activeOrganizationId?: unknown;
}) {
  return {
    id: typeof claims.id === "string" ? claims.id : "",
    // A missing claim is a legacy token; donor is the safe (non-admin) default.
    role: isUserRole(claims.role) ? claims.role : ("donor" as const),
    activeOrganizationId:
      typeof claims.activeOrganizationId === "string"
        ? claims.activeOrganizationId
        : null,
  };
}
