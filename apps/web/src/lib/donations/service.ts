import { DonationInputSchema, type DonationInput } from "@aahaarloop/shared";

import { ApiError } from "../api/errors.ts";
import type {
  Donation,
  DonationEvent,
  FoodCategory,
  StorageType,
} from "../domain/types.ts";

export interface DonationRepository {
  all(): readonly Donation[];
  find(id: string): Donation | undefined;
  save(donation: Donation): void;
}

const CATEGORIES: readonly string[] = [
  "produce",
  "bakery",
  "dairy",
  "prepared",
  "pantry",
  "beverages",
  "other",
];

function toCategory(value: string): FoodCategory {
  return CATEGORIES.includes(value) ? (value as FoodCategory) : "other";
}

function toStorage(value: string): StorageType {
  if (value === "refrigerated") return "chilled";
  return value === "chilled" || value === "frozen" || value === "ambient"
    ? value
    : "ambient";
}

export type DonationPatch = Partial<
  Pick<Donation, "title" | "description" | "servingsAvailable" | "pickupAddress">
>;

export function createDonationService(
  repo: DonationRepository,
  now: () => string = () => new Date().toISOString(),
) {
  const event = (type: DonationEvent["type"], actor: string): DonationEvent => ({
    id: crypto.randomUUID(),
    at: now(),
    type,
    actor,
  });

  const requireOwned = (id: string, organizationId: string): Donation => {
    const donation = repo.find(id);
    if (!donation) throw new ApiError("not_found", "Donation not found");
    if (donation.organizationId !== organizationId) {
      throw new ApiError("forbidden", "Donation belongs to another organization");
    }
    return donation;
  };

  return {
    list(organizationId?: string): readonly Donation[] {
      const all = repo.all();
      return organizationId
        ? all.filter((donation) => donation.organizationId === organizationId)
        : all.filter((donation) => donation.status === "published");
    },

    get(id: string, organizationId?: string): Donation {
      const donation = repo.find(id);
      if (!donation) throw new ApiError("not_found", "Donation not found");
      const owned = organizationId && donation.organizationId === organizationId;
      if (!owned && donation.status !== "published") {
        throw new ApiError("not_found", "Donation not found");
      }
      return donation;
    },

    create(input: DonationInput, organizationId: string, actor: string): Donation {
      if (!organizationId) {
        throw new ApiError("forbidden", "No active organization");
      }
      const first = input.items[0];
      const donation: Donation = {
        id: crypto.randomUUID(),
        organizationId,
        title: input.title,
        description: input.description ?? "",
        category: toCategory(first.category),
        storage: toStorage(first.storage),
        servingsTotal: input.total_servings,
        servingsAvailable: input.available_servings ?? input.total_servings,
        // shortcut: no volumetric data in the input; weight is filled at pickup.
        weightKg: 0,
        allergens: [...new Set(input.items.flatMap((item) => item.allergens))],
        dietTags: [...new Set(input.items.flatMap((item) => item.dietary_flags))],
        packaging: "",
        pickupAddress: input.pickup_location.address,
        pickupArea: input.pickup_location.label ?? "",
        location: input.pickup_location.point,
        foodExpiryAt: input.food_expiry_at ?? "",
        bestBeforeAt: input.best_before_at ?? "",
        pickupDeadlineAt: input.pickup_deadline_at ?? "",
        status: "draft",
        ...(input.image_url ? { photoName: input.image_url } : {}),
        createdAt: now(),
        updatedAt: now(),
        events: [event("created", actor)],
      };
      repo.save(donation);
      return donation;
    },

    update(
      id: string,
      organizationId: string,
      actor: string,
      patch: DonationPatch,
    ): Donation {
      const donation = requireOwned(id, organizationId);
      if (donation.status !== "draft" && donation.status !== "published") {
        throw new ApiError("conflict", "Only draft or published donations can be edited");
      }
      const updated: Donation = {
        ...donation,
        ...patch,
        updatedAt: now(),
        events: [...donation.events, event("edited", actor)],
      };
      repo.save(updated);
      return updated;
    },

    publish(id: string, organizationId: string, actor: string): Donation {
      const donation = requireOwned(id, organizationId);
      if (donation.status !== "draft") {
        throw new ApiError("conflict", "Only draft donations can be published");
      }
      if (!donation.pickupAddress || !donation.location.latitude) {
        throw new ApiError(
          "validation_error",
          "A pickup address and a located pin are required before publishing",
        );
      }
      const published: Donation = {
        ...donation,
        status: "published",
        updatedAt: now(),
        events: [...donation.events, event("published", actor)],
      };
      repo.save(published);
      return published;
    },
  };
}

export function parseDonationInput(value: unknown): DonationInput {
  return DonationInputSchema.parse(value);
}
