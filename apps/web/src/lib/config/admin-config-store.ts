import * as dal from "@/lib/data/dal";

import { setAdminConfig, type AdminConfig } from "./admin-config";

let loaded: Promise<void> | undefined;

/** Hydrates the synchronous config snapshot from Postgres once per process. */
export async function ensureAdminConfig(): Promise<void> {
  if (!loaded) {
    loaded = dal
      .loadAdminConfig()
      .then((config) => {
        if (config) setAdminConfig(config);
      })
      .catch((error: unknown) => {
        loaded = undefined;
        throw error;
      });
  }
  await loaded;
}

export async function persistAdminConfig(config: AdminConfig): Promise<void> {
  await dal.saveAdminConfig(config);
}
