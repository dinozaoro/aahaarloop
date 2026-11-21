export const ADMIN_RESOURCES = [
  "users",
  "organizations",
  "donations",
  "claims",
  "missions",
] as const;
export type AdminResource = (typeof ADMIN_RESOURCES)[number];

export interface AdminQuery {
  search?: string;
  status?: string;
  page: number;
  pageSize: number;
}

export interface AdminPage<T> {
  page: number;
  pageSize: number;
  total: number;
  data: T[];
}

const SEARCH_FIELDS: Record<AdminResource, readonly string[]> = {
  users: ["name", "email", "role"],
  organizations: ["name", "area", "kind"],
  donations: ["title", "status", "category", "pickupArea"],
  claims: ["donationTitle", "status", "recipientName"],
  missions: ["address", "status", "donationId"],
};

/** Pure, reusable search + pagination for every admin table. */
export function queryResource<T extends Record<string, unknown>>(
  resource: AdminResource,
  rows: readonly T[],
  query: AdminQuery,
): AdminPage<T> {
  const term = query.search?.trim().toLowerCase() ?? "";
  const filtered = rows.filter((row) => {
    if (query.status && row.status !== query.status) return false;
    if (!term) return true;
    return SEARCH_FIELDS[resource].some((field) =>
      String(row[field] ?? "")
        .toLowerCase()
        .includes(term),
    );
  });
  const page = Math.max(1, Math.floor(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Math.floor(query.pageSize) || 20));
  return {
    page,
    pageSize,
    total: filtered.length,
    data: filtered.slice((page - 1) * pageSize, page * pageSize),
  };
}

export function resourceDetail<T extends { id: string }>(
  rows: readonly T[],
  id: string,
): T {
  const row = rows.find((item) => item.id === id);
  if (!row) throw new Error("NOT_FOUND");
  return row;
}

export interface AdminSummary {
  users: number;
  organizations: number;
  donations: number;
  claims: number;
  missions: number;
}

export function adminSummary(counts: AdminSummary): AdminSummary {
  return counts;
}
