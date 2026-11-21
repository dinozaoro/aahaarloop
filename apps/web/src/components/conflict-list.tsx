"use client";

import { useEffect, useState } from "react";

import {
  OfflineStore,
  type ConflictResolution,
  type OfflineConflict,
} from "@/lib/offline";

export function ConflictList() {
  const [store, setStore] = useState<OfflineStore | null>(null);
  const [conflicts, setConflicts] = useState<OfflineConflict[]>([]);

  useEffect(() => {
    let active = true;
    void OfflineStore.open().then(async (opened) => {
      const records = await opened.conflicts.getAll();
      if (active) {
        setStore(opened);
        setConflicts(records);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  async function resolve(id: string, resolution: Exclude<ConflictResolution, "pending">) {
    if (!store) {
      return;
    }
    await store.conflicts.update(id, {
      resolution,
      resolvedAt: new Date().toISOString(),
    });
    setConflicts(await store.conflicts.getAll());
  }

  if (conflicts.length === 0) {
    return <p className="dashboard-empty">No conflicts need your review.</p>;
  }

  return (
    <ul className="conflict-list">
      {conflicts.map((conflict) => (
        <li key={conflict.id}>
          <div>
            <strong>{conflict.entityType}</strong>
            <span>{conflict.entityId ?? "new record"} · {conflict.resolution}</span>
          </div>
          {conflict.resolution === "pending" ? (
            <div className="conflict-actions" role="group" aria-label={`Resolve ${conflict.entityType} conflict`}>
              <button type="button" onClick={() => void resolve(conflict.id, "merged")}>Merge</button>
              <button type="button" onClick={() => void resolve(conflict.id, "overwritten")}>Keep local</button>
              <button type="button" onClick={() => void resolve(conflict.id, "cancelled")}>Discard</button>
            </div>
          ) : (
            <span>Resolved</span>
          )}
        </li>
      ))}
    </ul>
  );
}
