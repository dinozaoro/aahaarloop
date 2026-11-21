import {
  calculateUrgency,
  type UrgencyLevel,
  type UrgencyResult,
  type UrgencyStatus,
} from "@aahaarloop/matching";

import type { BadgeVariant } from "@/components/ui/badge";
import { getAdminConfig } from "@/lib/config/admin-config";
import type { Donation } from "@/lib/domain/types";

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  low: "Low urgency",
  medium: "Medium urgency",
  high: "High urgency",
  critical: "Critical urgency",
};

export const URGENCY_STATUS_LABELS: Record<UrgencyStatus, string> = {
  active: "Active",
  expired: "Expired",
  infeasible: "Infeasible",
  unknown: "No deadline",
};

/**
 * Travel and handling are fixed estimates in the prototype; the matching
 * engine derives travel from distance when it ranks recipients.
 */
export function donationUrgency(
  donation: Donation,
  now: Date = new Date(),
): UrgencyResult {
  const config = getAdminConfig();
  return calculateUrgency({
    now,
    foodExpiryAt: donation.foodExpiryAt,
    pickupDeadlineAt: donation.pickupDeadlineAt,
    travelTimeMinutes: 20,
    handlingTimeMinutes: 10,
    bufferMinutes: config.safetyBufferMinutes,
    thresholds: config.urgencyThresholds,
  });
}

export function urgencyVariant(result: UrgencyResult): BadgeVariant {
  if (result.status === "expired" || result.status === "infeasible") {
    return "destructive";
  }
  if (result.status === "unknown" || result.level === null) {
    return "outline";
  }
  switch (result.level) {
    case "critical":
      return "destructive";
    case "high":
      return "warning";
    case "medium":
      return "secondary";
    case "low":
      return "success";
  }
}

export function urgencyLabel(result: UrgencyResult): string {
  if (result.status !== "active" || result.level === null) {
    return URGENCY_STATUS_LABELS[result.status];
  }
  return URGENCY_LABELS[result.level];
}
