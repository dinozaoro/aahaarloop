export interface SeriesPoint {
  label: string;
  value: number;
}

export interface DatedValue {
  updatedAt: string;
  weightKg: number;
}

/** Last `months` calendar months, oldest first, including empty months. */
export function monthlyRescued(
  records: readonly DatedValue[],
  now = new Date(),
  months = 6,
): SeriesPoint[] {
  const totals = new Map<string, number>();
  for (const record of records) {
    const date = new Date(record.updatedAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    totals.set(key, (totals.get(key) ?? 0) + record.weightKg);
  }

  const points: SeriesPoint[] = [];
  for (let offset = months - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    points.push({
      label: new Intl.DateTimeFormat("en-IN", { month: "short" }).format(date),
      value: Math.round((totals.get(key) ?? 0) * 10) / 10,
    });
  }
  return points;
}

export function statusCounts<T extends { status: string }>(
  records: readonly T[],
): SeriesPoint[] {
  const counts = new Map<string, number>();
  for (const record of records) {
    counts.set(record.status, (counts.get(record.status) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
