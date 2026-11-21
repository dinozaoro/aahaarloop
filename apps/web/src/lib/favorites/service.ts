import type { Donation } from "@/lib/domain/types";

export interface Favorite {
  userId: string;
  organizationId: string;
  donationId: string;
  createdAt: string;
}

const favorites = new Map<string, Favorite>();

const keyFor = (userId: string, donationId: string) => `${userId}:${donationId}`;

export const favoriteService = {
  list(userId: string, organizationId: string, donations: readonly Donation[]): Favorite[] {
    const allowed = new Set(
      donations
        .filter((donation) => donation.status === "published" && donation.servingsAvailable > 0)
        .map((donation) => donation.id),
    );
    return [...favorites.values()].filter(
      (favorite) =>
        favorite.userId === userId &&
        favorite.organizationId === organizationId &&
        allowed.has(favorite.donationId),
    );
  },

  add(userId: string, organizationId: string, donationId: string): Favorite {
    const key = keyFor(userId, donationId);
    const current = favorites.get(key);
    if (current) return current;
    const favorite = {
      userId,
      organizationId,
      donationId,
      createdAt: new Date().toISOString(),
    };
    favorites.set(key, favorite);
    return favorite;
  },

  remove(userId: string, donationId: string): boolean {
    return favorites.delete(keyFor(userId, donationId));
  },
};
