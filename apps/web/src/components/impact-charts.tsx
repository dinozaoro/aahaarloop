import type { SeriesPoint } from "@/lib/impact/series";

function BarChart({ title, data }: { title: string; data: SeriesPoint[] }) {
  const max = Math.max(1, ...data.map((point) => point.value));
  return (
    <section className="impact-chart" aria-label={title}>
      <h2>{title}</h2>
      {data.length === 0 ? (
        <p className="dashboard-empty">No data to chart yet.</p>
      ) : (
        <ul className="impact-bars">
          {data.map((point) => (
            <li key={point.label}>
              <span className="impact-bar-label">{point.label}</span>
              <span className="impact-bar-track" aria-hidden="true">
                <span style={{ width: `${(point.value / max) * 100}%` }} />
              </span>
              <strong>{point.value}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function ImpactCharts({
  monthly,
  statuses,
}: {
  monthly: SeriesPoint[];
  statuses: SeriesPoint[];
}) {
  return (
    <div className="impact-charts">
      <BarChart title="Food rescued by month (kg)" data={monthly} />
      <BarChart title="Claims by status" data={statuses} />
    </div>
  );
}
