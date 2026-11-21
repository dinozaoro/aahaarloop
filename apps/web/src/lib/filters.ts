
export function filterByStatus(donations: any[], status: string | null): any[] {
  if (!status) return donations;
  return donations.filter((d: any) => d.status === status);
}

export function filterByCategory(donations: any[], category: string | null): any[] {
  if (!category) return donations;
  return donations.filter((d: any) => d.category === category);
}
