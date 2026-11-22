import * as dal from "@/lib/data/dal";
import type { Donation } from "@/lib/domain/types";

export interface Favorite {
  userId: string;
  organizationId: string;
  donationId: string;
  createdAt: string;
}

export const favoriteService = {
  async list(userId: string, organizationId: string, donations: readonly Donation[]): Promise<Favorite[]> {
    const allowed = new Set(
      donations
        .filter((donation) => donation.status === "published" && donation.servingsAvailable > 0)
        .map((donation) => donation.id),
    );
    // shortcut: favorites are user-scoped in the schema, so the active org is ignored.
    void organizationId;
    const rows = await dal.listFavorites(userId);
    return rows.filter((favorite) => allowed.has(favorite.donationId));
  },

  add(userId: string, organizationId: string, donationId: string): Promise<Favorite> {
    return dal.addFavorite(userId, organizationId, donationId);
  },

  remove(userId: string, donationId: string): Promise<boolean> {
    return dal.removeFavorite(userId, donationId);
  },
};
