import { pgEnum } from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "donor",
  "recipient",
  "volunteer",
  "admin",
]);

export const organizationRole = pgEnum("organization_role", [
  "owner",
  "admin",
  "member",
]);

export const donationStatus = pgEnum("donation_status", [
  "draft",
  "published",
  "claimed",
  "pickup_scheduled",
  "picked_up",
  "delivered",
  "cancelled",
  "expired",
]);

export const claimStatus = pgEnum("claim_status", [
  "pending",
  "confirmed",
  "pickup_scheduled",
  "picked_up",
  "delivered",
  "cancelled",
  "expired",
]);

export const storageType = pgEnum("storage_type", [
  "ambient",
  "refrigerated",
  "frozen",
]);

export const quantityUnit = pgEnum("quantity_unit", [
  "servings",
  "kilograms",
  "litres",
  "pieces",
]);

export const pickupTaskStatus = pgEnum("pickup_task_status", [
  "unassigned",
  "assigned",
  "in_progress",
  "completed",
  "cancelled",
]);

export const transitionActor = pgEnum("transition_actor", [
  "donor",
  "recipient",
  "volunteer",
  "admin",
  "system",
]);

export const syncStatus = pgEnum("sync_status", [
  "pending",
  "in_progress",
  "completed",
  "failed",
  "conflict",
]);

export const conflictResolution = pgEnum("conflict_resolution", [
  "pending",
  "local",
  "remote",
  "merged",
  "manual",
]);

export const reportStatus = pgEnum("report_status", [
  "open",
  "investigating",
  "resolved",
  "dismissed",
]);

export const devicePlatform = pgEnum("device_platform", [
  "web",
  "ios",
  "android",
]);
