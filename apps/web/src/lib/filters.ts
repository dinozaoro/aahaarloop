export function filterByStatus(
  donations: any[],
  status: "active" | "expiring" | "history" | "infeasible"
): any[] {
  return donations.filter((donation) => donation.status === status);
}

export function filterByCategory(
  donations: any[],
  category: string
): any[] {
  return donations.filter((donation) => donation.category === category);
}