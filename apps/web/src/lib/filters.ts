type DonationStatus = "active" | "expiring" | "history" | "infeasible";

export function filterByStatus<T extends { status: DonationStatus }>(
  donations: readonly T[],
  status: DonationStatus
): T[] {
  return donations.filter((donation) => donation.status === status);
}

export function filterByCategory<T extends { category: string }>(
  donations: readonly T[],
  category: string
): T[] {
  return donations.filter((donation) => donation.category === category);
}
