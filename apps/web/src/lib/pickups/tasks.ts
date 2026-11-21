import {
  canAcceptMission,
  haversineDistanceKm,
  type VolunteerProfile,
} from "@aahaarloop/matching";

import { ApiError } from "../api/errors.ts";
import type { Claim, Donation, PickupAssignment, PickupTask } from "../domain/types.ts";

export interface PickupRepository {
  tasks(): readonly PickupTask[];
  assignments(): readonly PickupAssignment[];
  saveTask(task: PickupTask): void;
  saveAssignment(assignment: PickupAssignment): void;
  findVolunteer(id: string): VolunteerProfile | undefined;
  audit(taskId: string, action: string, actorId: string): void;
}

export function createPickupService(
  repo: PickupRepository,
  now: () => string = () => new Date().toISOString(),
) {
  return {
    generateForClaim(claim: Claim, donation: Donation): PickupTask {
      const existing = repo.tasks().find((task) => task.claimId === claim.id);
      if (existing) return existing;
      const task: PickupTask = {
        id: crypto.randomUUID(),
        donationId: donation.id,
        claimId: claim.id,
        status: "unassigned",
        windowStart: now(),
        windowEnd: donation.pickupDeadlineAt || now(),
        address: donation.pickupAddress,
        location: donation.location,
        weightKg: claim.weightKg,
        createdAt: now(),
      };
      repo.saveTask(task);
      repo.audit(task.id, "pickup.task.created", claim.recipientOrgId);
      return task;
    },

    assign(taskId: string, volunteerId: string, actorId: string): PickupAssignment {
      const task = repo.tasks().find((item) => item.id === taskId);
      if (!task) throw new ApiError("not_found", "Pickup task not found");
      if (repo.assignments().some((item) => item.taskId === taskId)) {
        throw new ApiError("conflict", "Pickup task is already assigned");
      }
      const volunteer = repo.findVolunteer(volunteerId);
      if (!volunteer) throw new ApiError("not_found", "Volunteer not found");
      const distanceKm = haversineDistanceKm(
        volunteer.serviceArea.center,
        task.location,
      );
      if (distanceKm > volunteer.serviceArea.radiusKm) {
        throw new ApiError("conflict", "Pickup is outside the volunteer service area");
      }
      const accepted = canAcceptMission(volunteer, {
        pickupLocation: task.location,
        weightKg: task.weightKg,
        pickupWindow: { start: task.windowStart, end: task.windowEnd },
      });
      if (!accepted) {
        throw new ApiError("conflict", "Volunteer capacity or availability is insufficient");
      }
      const assignment: PickupAssignment = {
        id: crypto.randomUUID(),
        taskId,
        volunteerId,
        status: "assigned",
        assignedAt: now(),
      };
      repo.saveAssignment(assignment);
      repo.saveTask({ ...task, status: "assigned" });
      repo.audit(task.id, "pickup.task.assigned", actorId);
      return assignment;
    },

    complete(taskId: string, volunteerId: string): PickupTask {
      const task = repo.tasks().find((item) => item.id === taskId);
      if (!task) throw new ApiError("not_found", "Pickup task not found");
      const assignment = repo
        .assignments()
        .find((item) => item.taskId === taskId && item.volunteerId === volunteerId);
      if (!assignment) throw new ApiError("forbidden", "Only the assignee can complete a task");
      const completed: PickupTask = { ...task, status: "completed" };
      repo.saveTask(completed);
      repo.saveAssignment({ ...assignment, status: "completed" });
      repo.audit(task.id, "pickup.task.completed", volunteerId);
      return completed;
    },
  };
}
