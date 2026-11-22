"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ReportRow {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  createdAt: string;
  aiAuthenticity: {
    status: string;
    signal: { score: number } | null;
  } | null;
}

export function ModerationQueue() {
  const router = useRouter();
  const [reports, setReports] = useState<ReportRow[]>([]);

  useEffect(() => {
    void fetch("/api/admin/reports")
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) setReports(data.data ?? []);
      })
      .catch(() => undefined);
  }, []);

  async function decide(id: string, decision: "resolve" | "dismiss") {
    const response = await fetch(`/api/admin/reports/${id}/${decision}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({}),
    });
    if (response.ok) {
      setReports((current) =>
        current.map((report) =>
          report.id === id
            ? { ...report, status: decision === "resolve" ? "resolved" : "dismissed" }
            : report,
        ),
      );
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {reports.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No reports in the queue.
        </p>
      )}
      <ul className="space-y-3">
        {reports.map((report) => (
          <li key={report.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {report.reason.replace(/_/g, " ")} · {report.targetType}{" "}
                  {report.targetId.slice(0, 8)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Reported {new Date(report.createdAt).toLocaleString()}
                </p>
              </div>
              <Badge
                variant={
                  report.status === "open"
                    ? "warning"
                    : report.status === "resolved"
                      ? "success"
                      : "secondary"
                }
              >
                {report.status}
              </Badge>
            </div>

            {report.aiAuthenticity && (
              <p className="mt-2 text-xs text-muted-foreground" data-testid="ai-signal">
                AI authenticity: {report.aiAuthenticity.status}
                {report.aiAuthenticity.signal
                  ? ` (score ${report.aiAuthenticity.signal.score})`
                  : ""}
                <span className="ml-1">— admin only</span>
              </p>
            )}

            {report.status === "open" && (
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={() => void decide(report.id, "resolve")}>
                  Resolve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void decide(report.id, "dismiss")}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
