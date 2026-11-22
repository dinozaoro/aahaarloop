import "server-only";

import {
  claimItems,
  claims,
  donationAllergens,
  donationEvents,
  donationImages,
  donations,
  donorProfiles,
  favorites,
  foodAllergens,
  foodCategories,
  notificationPreferences,
  notifications,
  organizations,
  pickupAssignments,
  pickupTasks,
  profiles,
  recipientNeeds,
  recipientProfiles,
  users,
  volunteerProfiles,
} from "@aahaarloop/database";
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import type {
  Claim,
  ClaimEvent,
  Donation,
  DonationEvent,
  DonationStatus,
  FoodCategory,
  Need,
  Organization,
  PickupAssignment,
  PickupTask,
  StorageType,
} from "@/lib/domain/types";
import type { Favorite } from "@/lib/favorites/service";
import type {
  Notification,
  NotificationPreferences,
} from "@/lib/notifications/service";
import type { VolunteerProfile } from "@aahaarloop/matching";

const CATEGORY_BY_SLUG: Record<string, FoodCategory> = {
  "cooked-meals": "prepared",
  "fresh-produce": "produce",
  produce: "produce",
  fruits: "produce",
  bakery: "bakery",
  dairy: "dairy",
  snacks: "pantry",
  pantry: "pantry",
  beverages: "beverages",
  prepared: "prepared",
};
const SLUG_BY_CATEGORY: Record<FoodCategory, string> = {
  produce: "fresh-produce",
  bakery: "bakery",
  dairy: "dairy",
  prepared: "cooked-meals",
  pantry: "pantry",
  beverages: "beverages",
  other: "cooked-meals",
};

function toCategory(slug: string | null | undefined): FoodCategory {
  return (slug && CATEGORY_BY_SLUG[slug]) || "other";
}

function toStorage(value: string | null | undefined): StorageType {
  // shortcut: the DB enum uses "refrigerated" for the UI's "chilled".
  return value === "refrigerated" ? "chilled" : (value as StorageType) || "ambient";
}

function fromStorage(value: StorageType): "refrigerated" | "ambient" | "frozen" {
  return value === "chilled" ? "refrigerated" : value;
}

const iso = (value: Date | null | undefined): string => value?.toISOString() ?? "";
const isoOrNull = (value: Date | null | undefined): string | null =>
  value?.toISOString() ?? null;
const num = (value: string | number | null | undefined): number =>
  value == null ? 0 : Number(value);

type DonationRow = typeof donations.$inferSelect;
type ClaimRow = typeof claims.$inferSelect;
type OrganizationRow = typeof organizations.$inferSelect;

async function donationRows(ids?: string[]): Promise<DonationRow[]> {
  const db = await getDb();
  const query = db.select().from(donations);
  const rows = ids
    ? ids.length
      ? await query.where(inArray(donations.id, ids))
      : []
    : await query;
  return rows;
}

async function decorateDonations(rows: DonationRow[]): Promise<Donation[]> {
  if (!rows.length) return [];
  const db = await getDb();
  const ids = rows.map((row) => row.id);
  const [categoryRows, allergenRows, eventRows, orgRows, imageRows] =
    await Promise.all([
      db.select().from(foodCategories),
      db
        .select({ donationId: donationAllergens.donationId, name: foodAllergens.name })
        .from(donationAllergens)
        .innerJoin(foodAllergens, eq(donationAllergens.allergenId, foodAllergens.id))
        .where(inArray(donationAllergens.donationId, ids)),
      db
        .select()
        .from(donationEvents)
        .where(inArray(donationEvents.donationId, ids))
        .orderBy(asc(donationEvents.occurredAt)),
      db.select().from(organizations),
      db.select().from(donationImages).where(inArray(donationImages.donationId, ids)),
    ]);
  const categories = new Map(categoryRows.map((row) => [row.id, row.slug]));
  const orgs = new Map(orgRows.map((row) => [row.id, row]));
  const allergenMap = new Map<string, string[]>();
  for (const row of allergenRows) {
    allergenMap.set(row.donationId, [...(allergenMap.get(row.donationId) ?? []), row.name]);
  }
  const eventMap = new Map<string, DonationEvent[]>();
  for (const row of eventRows) {
    const entry: DonationEvent = {
      id: row.id,
      at: iso(row.occurredAt),
      type: (row.toStatus as DonationEvent["type"]) ?? "created",
      actor: row.actorId ?? row.actorType,
      ...(row.reason ? { note: row.reason } : {}),
    };
    eventMap.set(row.donationId, [...(eventMap.get(row.donationId) ?? []), entry]);
  }
  const photoMap = new Map(imageRows.map((row) => [row.donationId, row.url]));

  return rows.map((row) => {
    const org = orgRows.length ? orgs.get(row.organizationId) : undefined;
    return {
      id: row.id,
      organizationId: row.organizationId,
      title: row.title,
      description: row.description ?? "",
      category: toCategory(row.categoryId ? categories.get(row.categoryId) : undefined),
      storage: toStorage(row.storage),
      servingsTotal: row.quantity,
      servingsAvailable: row.remainingQuantity,
      // shortcut: no volumetric data in the schema; weight is filled at pickup.
      weightKg: 0,
      allergens: allergenMap.get(row.id) ?? [],
      dietTags: [],
      packaging: row.packaging ?? "",
      pickupAddress: row.address ?? "",
      // shortcut: area is derived from the owning organization's address.
      pickupArea: org?.address ?? row.address ?? "",
      location: {
        latitude: num(row.latitude),
        longitude: num(row.longitude),
      },
      foodExpiryAt: iso(row.foodExpiryAt),
      bestBeforeAt: iso(row.bestBeforeAt),
      pickupDeadlineAt: iso(row.pickupDeadlineAt),
      status: row.status as DonationStatus,
      ...(photoMap.has(row.id) ? { photoName: photoMap.get(row.id) } : {}),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
      events: eventMap.get(row.id) ?? [],
    };
  });
}

export async function listDonations(): Promise<readonly Donation[]> {
  return decorateDonations(await donationRows());
}

export async function findDonation(id: string): Promise<Donation | undefined> {
  const [row] = await donationRows([id]);
  const [donation] = await decorateDonations(row ? [row] : []);
  return donation;
}

export async function saveDonation(donation: Donation, actorId: string): Promise<void> {
  const db = await getDb();
  const [category] = await db
    .select({ id: foodCategories.id })
    .from(foodCategories)
    .where(eq(foodCategories.slug, SLUG_BY_CATEGORY[donation.category]))
    .limit(1);
  const [existing] = await db
    .select({ createdByUserId: donations.createdByUserId })
    .from(donations)
    .where(eq(donations.id, donation.id))
    .limit(1);
  const values = {
    organizationId: donation.organizationId,
    createdByUserId: existing?.createdByUserId ?? actorId,
    title: donation.title,
    description: donation.description,
    categoryId: category?.id ?? null,
    status: donation.status,
    foodExpiryAt: donation.foodExpiryAt ? new Date(donation.foodExpiryAt) : null,
    bestBeforeAt: donation.bestBeforeAt ? new Date(donation.bestBeforeAt) : null,
    pickupDeadlineAt: donation.pickupDeadlineAt ? new Date(donation.pickupDeadlineAt) : null,
    effectiveDeadlineAt: [donation.foodExpiryAt, donation.pickupDeadlineAt]
      .filter(Boolean)
      .map((value) => new Date(value))
      .sort((a, b) => a.getTime() - b.getTime())[0] ?? null,
    quantity: donation.servingsTotal,
    remainingQuantity: donation.servingsAvailable,
    quantityUnit: "servings" as const,
    storage: fromStorage(donation.storage),
    packaging: donation.packaging,
    address: donation.pickupAddress,
    latitude: String(donation.location.latitude),
    longitude: String(donation.location.longitude),
    contactName: null as string | null,
    contactPhone: null as string | null,
    pickupInstructions: null as string | null,
    splittable: false,
    publishedAt: donation.status === "published" ? new Date() : null,
    updatedAt: new Date(),
  };
  await db.insert(donations).values({ ...values, id: donation.id }).onConflictDoUpdate({
    target: donations.id,
    set: values,
  });

  const allergenRows = await db.select().from(foodAllergens);
  const allergenIds = allergenRows
    .filter((row) => donation.allergens.includes(row.name))
    .map((row) => row.id);
  await db.delete(donationAllergens).where(eq(donationAllergens.donationId, donation.id));
  if (allergenIds.length) {
    await db
      .insert(donationAllergens)
      .values(allergenIds.map((allergenId) => ({ donationId: donation.id, allergenId })));
  }
  const existingEvents = await db
    .select({ id: donationEvents.id })
    .from(donationEvents)
    .where(eq(donationEvents.donationId, donation.id));
  const seen = new Set(existingEvents.map((row) => row.id));
  const newEvents = donation.events.filter((event) => !seen.has(event.id));
  if (newEvents.length) {
    await db.insert(donationEvents).values(
      newEvents.map((event) => ({
        id: event.id,
        donationId: donation.id,
        actorType: "system" as const,
        actorId: actorId,
        toStatus: event.type,
        reason: event.note ?? null,
        occurredAt: new Date(event.at),
      })),
    );
  }
}

async function decorateClaims(rows: ClaimRow[]): Promise<Claim[]> {
  if (!rows.length) return [];
  const db = await getDb();
  const [donationRows, orgRows, eventRows, itemRows] = await Promise.all([
    db.select().from(donations).where(
      inArray(donations.id, [...new Set(rows.map((row) => row.donationId))]),
    ),
    db.select().from(organizations),
    db
      .select()
      .from(donationEvents)
      .where(inArray(donationEvents.claimId, rows.map((row) => row.id)))
      .orderBy(asc(donationEvents.occurredAt)),
    db.select().from(claimItems).where(inArray(claimItems.claimId, rows.map((row) => row.id))),
  ]);
  const donationMap = new Map(donationRows.map((row) => [row.id, row]));
  const orgMap = new Map(orgRows.map((row) => [row.id, row.name]));
  const historyMap = new Map<string, ClaimEvent[]>();
  for (const row of eventRows) {
    if (!row.claimId) continue;
    const entry: ClaimEvent = {
      id: row.id,
      at: iso(row.occurredAt),
      type: (row.toStatus as ClaimEvent["type"]) ?? "created",
      actor: row.actorId ?? row.actorType,
      ...(row.reason ? { note: row.reason } : {}),
    };
    historyMap.set(row.claimId, [...(historyMap.get(row.claimId) ?? []), entry]);
  }
  const itemMap = new Map<string, { name: string; quantity: number }[]>();
  for (const row of itemRows) {
    itemMap.set(row.claimId, [
      ...(itemMap.get(row.claimId) ?? []),
      { name: "Donation item", quantity: row.quantity },
    ]);
  }
  return rows.map((row) => {
    const donation = donationMap.get(row.donationId);
    return {
      id: row.id,
      ...(row.idempotencyKey ? { idempotencyKey: row.idempotencyKey } : {}),
      ...(itemMap.has(row.id) ? { items: itemMap.get(row.id) } : {}),
      donationId: row.donationId,
      donationTitle: donation?.title ?? "",
      donorOrganizationId: donation?.organizationId ?? "",
      recipientOrgId: row.recipientOrgId,
      recipientName: orgMap.get(row.recipientOrgId) ?? "",
      servings: row.quantity,
      weightKg: 0,
      status: row.status,
      ...(row.expiresAt ? { expiresAt: iso(row.expiresAt) } : {}),
      ...(row.cancelledAt ? { cancelledAt: iso(row.cancelledAt) } : {}),
      ...(row.cancelReason ? { cancelReason: row.cancelReason } : {}),
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
      history: historyMap.get(row.id) ?? [],
    };
  });
}

export async function listClaims(): Promise<readonly Claim[]> {
  const db = await getDb();
  return decorateClaims(await db.select().from(claims));
}

export async function findClaim(id: string): Promise<Claim | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(claims).where(eq(claims.id, id)).limit(1);
  const [claim] = await decorateClaims(row ? [row] : []);
  return claim;
}

export async function findClaimByIdempotencyKey(key: string): Promise<Claim | undefined> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(claims)
    .where(eq(claims.idempotencyKey, key))
    .limit(1);
  const [claim] = await decorateClaims(row ? [row] : []);
  return claim;
}

export async function saveClaim(claim: Claim, actorId: string): Promise<void> {
  const db = await getDb();
  const [existing] = await db
    .select({ claimedByUserId: claims.claimedByUserId })
    .from(claims)
    .where(eq(claims.id, claim.id))
    .limit(1);
  const values = {
    donationId: claim.donationId,
    recipientOrgId: claim.recipientOrgId,
    claimedByUserId: existing?.claimedByUserId ?? actorId,
    status: claim.status,
    quantity: claim.servings,
    unit: "servings" as const,
    expiresAt: claim.expiresAt ? new Date(claim.expiresAt) : null,
    cancelledAt: claim.cancelledAt ? new Date(claim.cancelledAt) : null,
    cancelReason: claim.cancelReason ?? null,
    idempotencyKey: claim.idempotencyKey ?? null,
    updatedAt: new Date(),
  };
  await db.insert(claims).values({ ...values, id: claim.id }).onConflictDoUpdate({
    target: claims.id,
    set: values,
  });
  const event = claim.history.at(-1);
  if (event) {
    await db.insert(donationEvents).values({
      id: event.id,
      donationId: claim.donationId,
      claimId: claim.id,
      actorType: "recipient",
      actorId,
      toStatus: event.type,
      reason: event.note ?? null,
      occurredAt: new Date(event.at),
    }).onConflictDoNothing();
  }
}

export async function appendDonationEvent(
  donationId: string,
  type: "claimed" | "edited" | "cancelled" | "expired",
  actorId: string,
): Promise<void> {
  const db = await getDb();
  await db.insert(donationEvents).values({
    donationId,
    actorType: "system",
    actorId,
    toStatus: type,
    occurredAt: new Date(),
  });
}

async function decorateOrganizations(rows: OrganizationRow[]): Promise<Organization[]> {
  if (!rows.length) return [];
  const db = await getDb();
  const [recipients, volunteers] = await Promise.all([
    db.select().from(recipientProfiles),
    db.select().from(volunteerProfiles),
  ]);
  const recipientMap = new Map(recipients.map((row) => [row.organizationId, row]));
  const volunteerMap = new Map(volunteers.map((row) => [row.organizationId, row]));
  return rows.map((row) => {
    const recipient = recipientMap.get(row.id);
    const volunteer = volunteerMap.get(row.id);
    return {
      id: row.id,
      name: row.name,
      kind: (row.type as Organization["kind"]) || "donor",
      area: row.address ?? "",
      address: row.address ?? "",
      location: { latitude: num(row.latitude), longitude: num(row.longitude) },
      ...(row.description ? { description: row.description } : {}),
      verified: row.verifiedAt != null,
      storage: "ambient",
      transportCapacityKg:
        recipient?.transportCapacityKg ?? volunteer?.capacityKg ?? 0,
      capacityServings: 0,
      dietaryConstraints: recipient?.dietaryRestrictions ?? [],
      contactName: row.name,
      contactPhone: row.phone ?? "",
      ...(row.email ? { contactEmail: row.email } : {}),
    };
  });
}

export async function listOrganizations(): Promise<readonly Organization[]> {
  const db = await getDb();
  return decorateOrganizations(await db.select().from(organizations));
}

export async function findOrganization(id: string): Promise<Organization | undefined> {
  const db = await getDb();
  const [row] = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  const [org] = await decorateOrganizations(row ? [row] : []);
  return org;
}

export async function saveOrganization(organization: Organization): Promise<void> {
  const db = await getDb();
  const slug = organization.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  await db
    .insert(organizations)
    .values({
      id: organization.id,
      name: organization.name,
      slug,
      type: organization.kind,
      description: organization.description ?? null,
      email: organization.contactEmail ?? null,
      phone: organization.contactPhone || null,
      address: organization.address || null,
      latitude: String(organization.location.latitude),
      longitude: String(organization.location.longitude),
      verifiedAt: organization.verified ? new Date() : null,
    })
    .onConflictDoUpdate({
      target: organizations.id,
      set: {
        name: organization.name,
        description: organization.description ?? null,
        email: organization.contactEmail ?? null,
        phone: organization.contactPhone || null,
        address: organization.address || null,
      },
    });
}

export async function listNeeds(organizationId: string): Promise<readonly Need[]> {
  const db = await getDb();
  const [rows, categories] = await Promise.all([
    db
      .select()
      .from(recipientNeeds)
      .where(and(eq(recipientNeeds.organizationId, organizationId), isNull(recipientNeeds.deletedAt))),
    db.select().from(foodCategories),
  ]);
  const slugs = new Map(categories.map((row) => [row.id, row.slug]));
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organizationId,
    category: toCategory(row.categoryId ? slugs.get(row.categoryId) : undefined),
    servings: row.quantity,
    deadlineAt: iso(row.neededBy),
    // shortcut: priority is not a column; deadlines inside 24h are urgent.
    priority:
      row.neededBy && row.neededBy.getTime() - Date.now() < 24 * 60 * 60 * 1000
        ? "urgent"
        : "normal",
    notes: row.notes ?? "",
    status: row.fulfilledAt ? "fulfilled" : "active",
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }));
}

export async function saveNeed(need: Need, actorId: string): Promise<void> {
  const db = await getDb();
  const [category] = await db
    .select({ id: foodCategories.id })
    .from(foodCategories)
    .where(eq(foodCategories.slug, SLUG_BY_CATEGORY[need.category]))
    .limit(1);
  await db
    .insert(recipientNeeds)
    .values({
      id: need.id,
      organizationId: need.organizationId,
      createdByUserId: actorId,
      categoryId: category?.id ?? null,
      name: need.notes || need.category,
      quantity: need.servings,
      unit: "servings",
      neededBy: need.deadlineAt ? new Date(need.deadlineAt) : null,
      fulfilledAt: need.status === "fulfilled" ? new Date() : null,
      notes: need.notes,
    })
    .onConflictDoUpdate({
      target: recipientNeeds.id,
      set: {
        name: need.notes || need.category,
        quantity: need.servings,
        neededBy: need.deadlineAt ? new Date(need.deadlineAt) : null,
        fulfilledAt: need.status === "fulfilled" ? new Date() : null,
        notes: need.notes,
        updatedAt: new Date(),
      },
    });
}

export async function closeNeed(id: string): Promise<void> {
  const db = await getDb();
  await db
    .update(recipientNeeds)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(recipientNeeds.id, id));
}

export async function listNotifications(userId: string): Promise<readonly Notification[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));
  return rows.map((row) => {
    const data = (row.data ?? {}) as Record<string, unknown>;
    return {
      id: row.id,
      userId: row.userId,
      type: row.type as Notification["type"],
      title: row.title,
      body: row.body ?? "",
      entityType: typeof data.entityType === "string" ? data.entityType : "donation",
      entityId: typeof data.entityId === "string" ? data.entityId : "",
      dedupeKey:
        typeof data.dedupeKey === "string"
          ? data.dedupeKey
          : `${row.type}:${row.id}:${row.userId}`,
      ...(row.data ? { data: data } : {}),
      readAt: isoOrNull(row.readAt),
      sentAt: isoOrNull(row.sentAt),
      createdAt: iso(row.createdAt),
    };
  });
}

export async function saveNotification(notification: Notification): Promise<void> {
  const db = await getDb();
  await db
    .insert(notifications)
    .values({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: {
        ...(notification.data ?? {}),
        entityType: notification.entityType,
        entityId: notification.entityId,
        dedupeKey: notification.dedupeKey,
      },
      readAt: notification.readAt ? new Date(notification.readAt) : null,
      sentAt: notification.sentAt ? new Date(notification.sentAt) : null,
      createdAt: new Date(notification.createdAt),
    })
    .onConflictDoUpdate({
      target: notifications.id,
      set: {
        readAt: notification.readAt ? new Date(notification.readAt) : null,
        sentAt: notification.sentAt ? new Date(notification.sentAt) : null,
      },
    });
}

export async function getNotificationPreferences(
  userId: string,
  fallback: NotificationPreferences,
): Promise<NotificationPreferences> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  if (!row) return fallback;
  return { channel: row.channel as NotificationPreferences["channel"], enabled: row.enabled };
}

export async function saveNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences,
): Promise<void> {
  const db = await getDb();
  await db
    .insert(notificationPreferences)
    .values({ userId, channel: preferences.channel, enabled: preferences.enabled })
    .onConflictDoUpdate({
      target: notificationPreferences.userId,
      set: { channel: preferences.channel, enabled: preferences.enabled },
    });
}

export async function listPickupTasks(): Promise<readonly PickupTask[]> {
  const db = await getDb();
  const rows = await db.select().from(pickupTasks);
  return rows.map((row) => ({
    id: row.id,
    donationId: row.donationId,
    claimId: row.claimId ?? "",
    status: row.status as PickupTask["status"],
    windowStart: iso(row.windowStart),
    windowEnd: iso(row.windowEnd),
    address: row.address ?? "",
    location: { latitude: num(row.latitude), longitude: num(row.longitude) },
    weightKg: num(row.capacityKg),
    createdAt: iso(row.createdAt),
  }));
}

export async function listPickupAssignments(): Promise<readonly PickupAssignment[]> {
  const db = await getDb();
  const rows = await db.select().from(pickupAssignments);
  return rows.map((row) => ({
    id: row.id,
    taskId: row.taskId,
    volunteerId: row.volunteerId,
    status: row.status as PickupAssignment["status"],
    assignedAt: iso(row.assignedAt),
  }));
}

export async function savePickupTask(task: PickupTask): Promise<void> {
  const db = await getDb();
  await db
    .insert(pickupTasks)
    .values({
      id: task.id,
      donationId: task.donationId,
      claimId: task.claimId || null,
      status: task.status,
      windowStart: new Date(task.windowStart),
      windowEnd: new Date(task.windowEnd),
      address: task.address,
      latitude: String(task.location.latitude),
      longitude: String(task.location.longitude),
      capacityKg: Math.round(task.weightKg),
    })
    .onConflictDoUpdate({
      target: pickupTasks.id,
      set: { status: task.status, updatedAt: new Date() },
    });
}

export async function savePickupAssignment(assignment: PickupAssignment): Promise<void> {
  const db = await getDb();
  await db
    .insert(pickupAssignments)
    .values({
      id: assignment.id,
      taskId: assignment.taskId,
      volunteerId: assignment.volunteerId,
      status: assignment.status,
      assignedAt: new Date(assignment.assignedAt),
      ...(assignment.status === "completed" ? { completedAt: new Date() } : {}),
    })
    .onConflictDoUpdate({
      target: pickupAssignments.id,
      set: { status: assignment.status, updatedAt: new Date() },
    });
}

export async function findVolunteerProfile(userId: string): Promise<VolunteerProfile | undefined> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(volunteerProfiles)
    .where(eq(volunteerProfiles.userId, userId))
    .limit(1);
  if (!row) return undefined;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [org] = row.organizationId
    ? await db.select().from(organizations).where(eq(organizations.id, row.organizationId)).limit(1)
    : [];
  const mode = String(row.vehicleType ?? "car").toLowerCase();
  const transportMode = (["walking", "bicycle", "motorcycle", "car", "van"].includes(mode)
    ? mode
    : "car") as VolunteerProfile["transportMode"];
  // shortcut: availability is stored as free text; use a wide window for assignment checks.
  const start = row.createdAt.toISOString();
  return {
    id: userId,
    displayName: user?.name ?? "",
    transportMode,
    transportCapacityKg: row.capacityKg ?? 0,
    serviceArea: {
      center: { latitude: num(org?.latitude), longitude: num(org?.longitude) },
      radiusKm: 25,
    },
    availability: [{ start, end: new Date(Date.now() + 7 * 24 * 3600_000).toISOString() }],
    verified: row.verifiedAt != null,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  };
}

export async function listFavorites(userId: string): Promise<readonly Favorite[]> {
  const db = await getDb();
  const rows = await db.select().from(favorites).where(eq(favorites.userId, userId));
  return rows.map((row) => ({
    userId: row.userId,
    organizationId: "",
    donationId: row.donationId,
    createdAt: iso(row.createdAt),
  }));
}

export async function addFavorite(
  userId: string,
  organizationId: string,
  donationId: string,
): Promise<Favorite> {
  const db = await getDb();
  const [existing] = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.donationId, donationId)))
    .limit(1);
  if (existing) {
    return {
      userId,
      organizationId,
      donationId,
      createdAt: iso(existing.createdAt),
    };
  }
  await db.insert(favorites).values({ userId, donationId });
  return { userId, organizationId, donationId, createdAt: new Date().toISOString() };
}

export async function removeFavorite(userId: string, donationId: string): Promise<boolean> {
  const db = await getDb();
  const result = await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.donationId, donationId)))
    .returning({ id: favorites.id });
  return result.length > 0;
}

export async function saveProfile(input: {
  userId: string;
  organizationId?: string | null;
  role: "donor" | "recipient" | "volunteer" | "admin";
  displayName: string;
  phone?: string;
  address?: { address: string };
  organizationName?: string;
  transportCapacityKg?: number;
  dietaryFlags?: string[];
  allergensAvoided?: string[];
}): Promise<void> {
  const db = await getDb();
  await db
    .update(users)
    .set({ name: input.displayName, updatedAt: new Date() })
    .where(eq(users.id, input.userId));
  await db
    .update(profiles)
    .set({ phone: input.phone ?? null, updatedAt: new Date() })
    .where(eq(profiles.userId, input.userId));

  if (input.organizationId && (input.organizationName || input.address)) {
    await db
      .update(organizations)
      .set({
        ...(input.organizationName ? { name: input.organizationName } : {}),
        ...(input.address ? { address: input.address.address } : {}),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, input.organizationId));
  }

  if (input.role === "recipient") {
    await db
      .update(recipientProfiles)
      .set({
        ...(input.transportCapacityKg == null
          ? {}
          : { transportCapacityKg: input.transportCapacityKg }),
        ...(input.dietaryFlags
          ? {
              dietaryRestrictions: [
                ...input.dietaryFlags,
                ...(input.allergensAvoided ?? []),
              ],
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(recipientProfiles.userId, input.userId));
  }
  if (input.role === "volunteer" && input.transportCapacityKg != null) {
    await db
      .update(volunteerProfiles)
      .set({ capacityKg: input.transportCapacityKg, updatedAt: new Date() })
      .where(eq(volunteerProfiles.userId, input.userId));
  }
  if (input.role === "donor" && input.address) {
    await db
      .update(donorProfiles)
      .set({ notes: input.address.address, updatedAt: new Date() })
      .where(eq(donorProfiles.userId, input.userId));
  }
}
