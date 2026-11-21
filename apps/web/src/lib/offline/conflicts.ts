export interface VersionedRecord {
  version: number;
  updatedAt: string;
}

/** A conflict exists when the two sides advanced to different versions. */
export function detectConflict(
  local: VersionedRecord,
  remote: VersionedRecord,
): boolean {
  return local.version !== remote.version || local.updatedAt !== remote.updatedAt;
}

export type ConflictStrategy = "merge" | "overwrite" | "cancel";

/**
 * Resolves from the local device's point of view. `overwrite` keeps local
 * values, `merge` keeps local values over a remote base, `cancel` drops the
 * local record. Every non-null result advances the version so the resolution
 * is itself a new revision and can be replayed.
 */
export function resolveConflict<T extends VersionedRecord>(
  local: T,
  remote: T,
  strategy: ConflictStrategy,
): T | null {
  if (strategy === "cancel") {
    return null;
  }
  const version = Math.max(local.version, remote.version) + 1;
  if (strategy === "overwrite") {
    return { ...local, version };
  }
  return { ...remote, ...local, version };
}
