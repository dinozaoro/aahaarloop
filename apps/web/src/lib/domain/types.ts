export type FoodCategory =
  | "produce"
  | "bakery"
  | "dairy"
  | "prepared"
  | "pantry"
  | "beverages"
  | "other";

export type StorageType = "ambient" | "chilled" | "frozen";

export type DonationStatus =
  | "draft"
  | "published"
  | "claimed"
  | "pickup_scheduled"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "expired";

export type ClaimStatus =
  | "pending"
  | "confirmed"
  | "pickup_scheduled"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "expired";

export type NeedPriority = "low" | "normal" | "urgent";
export type NeedStatus = "active" | "fulfilled" | "closed";

export type OrganizationKind = "donor" | "recipient" | "volunteer";

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Organization {
  id: string;
  name: string;
  kind: OrganizationKind;
  area: string;
  address: string;
  location: GeoPoint;
  description?: string | undefined;
  verified: boolean;
  storage: StorageType;
  transportCapacityKg: number;
  capacityServings: number;
  dietaryConstraints: string[];
  contactName: string;
  contactPhone: string;
  contactEmail?: string | undefined;
}

export type DonationEventType =
  | "created"
  | "published"
  | "edited"
  | "claimed"
  | "pickup_scheduled"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "expired";

export interface DonationEvent {
  id: string;
  at: string;
  type: DonationEventType;
  actor: string;
  note?: string;
}

export interface Donation {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  category: FoodCategory;
  storage: StorageType;
  servingsTotal: number;
  servingsAvailable: number;
  weightKg: number;
  allergens: string[];
  dietTags: string[];
  packaging: string;
  pickupAddress: string;
  pickupArea: string;
  location: GeoPoint;
  /** DLC: food-safety deadline. */
  foodExpiryAt: string;
  /** DDM: quality date, never treated as a safety deadline. */
  bestBeforeAt: string;
  /** Operational pickup deadline. */
  pickupDeadlineAt: string;
  status: DonationStatus;
  photoName?: string;
  createdAt: string;
  updatedAt: string;
  events: DonationEvent[];
}

export type ClaimEventType =
  | "created"
  | "confirmed"
  | "pickup_scheduled"
  | "picked_up"
  | "delivered"
  | "cancelled"
  | "expired";

export interface ClaimEvent {
  id: string;
  at: string;
  type: ClaimEventType;
  actor: string;
  note?: string;
}

export interface ClaimItemPortion {
  donationItemId?: string;
  name: string;
  quantity: number;
}

export interface Claim {
  id: string;
  /** Client key retained for idempotent replays; never returned to other orgs. */
  idempotencyKey?: string | undefined;
  /** Exact item breakdown of a partial or full claim. */
  items?: ClaimItemPortion[] | undefined;
  donationId: string;
  donationTitle: string;
  donorOrganizationId: string;
  recipientOrgId: string;
  recipientName: string;
  servings: number;
  weightKg: number;
  status: ClaimStatus;
  expiresAt?: string | undefined;
  cancelledAt?: string | undefined;
  cancelReason?: string | undefined;
  createdAt: string;
  updatedAt: string;
  history: ClaimEvent[];
}

export interface PickupTask {
  id: string;
  donationId: string;
  claimId: string;
  status: "unassigned" | "assigned" | "in_progress" | "completed" | "cancelled";
  windowStart: string;
  windowEnd: string;
  address: string;
  location: GeoPoint;
  weightKg: number;
  createdAt: string;
}

export interface PickupAssignment {
  id: string;
  taskId: string;
  volunteerId: string;
  status: "assigned" | "accepted" | "completed";
  assignedAt: string;
}

export interface Need {
  id: string;
  organizationId: string;
  category: FoodCategory;
  servings: number;
  deadlineAt: string;
  priority: NeedPriority;
  notes: string;
  status: NeedStatus;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  produce: "Produce",
  bakery: "Bakery",
  dairy: "Dairy",
  prepared: "Prepared meals",
  pantry: "Pantry",
  beverages: "Beverages",
  other: "Other",
};

export const STORAGE_LABELS: Record<StorageType, string> = {
  ambient: "Ambient",
  chilled: "Chilled",
  frozen: "Frozen",
};

export const DONATION_STATUS_LABELS: Record<DonationStatus, string> = {
  draft: "Draft",
  published: "Published",
  claimed: "Claimed",
  pickup_scheduled: "Pickup scheduled",
  picked_up: "Picked up",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const CLAIM_STATUS_LABELS: Record<ClaimStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  pickup_scheduled: "Pickup scheduled",
  picked_up: "Picked up",
  delivered: "Delivered",
  cancelled: "Cancelled",
  expired: "Expired",
};

export const ACTIVE_DONATION_STATUSES: DonationStatus[] = [
  "published",
  "claimed",
  "pickup_scheduled",
];

export const HISTORY_DONATION_STATUSES: DonationStatus[] = [
  "delivered",
  "cancelled",
  "expired",
];
