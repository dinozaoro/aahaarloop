import {
  canAcceptMission,
  haversineDistanceKm,
  type VolunteerProfile,
} from "@aahaarloop/matching";

import { ApiError } from "../api/errors.ts";
import type { Claim, Donation, PickupAssignment, PickupTask } from "../domain/types.ts";

export interface PickupRepository {
  tasks(): Promise<readonly PickupTask[]>;
  assignments(): Promise<readonly PickupAssignment[]>;
  saveTask(task: PickupTask): Promise<void>;
  saveAssignment(assignment: PickupAssignment): Promise<void>;
  findVolunteer(id: string): Promise<VolunteerProfile | undefined>;
  audit(taskId: string, action: string, actorId: string): Promise<void>;
}

export function createPickupService(
  repo: PickupRepository,
  now: () => string = () => new Date().toISOString(),
) {
  return {
    async generateForClaim(claim: Claim, donation: Donation): Promise<PickupTask> {
      const currentTasks = await repo.tasks();
      const existing = currentTasks.find((task) => task.claimId === claim.id);
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
      await repo.saveTask(task);
      await repo.audit(task.id, "pickup.task.created", claim.recipientOrgId);
      return task;
    },

    async assign(taskId: string, volunteerId: string, actorId: string): Promise<PickupAssignment> {
      const currentTasks = await repo.tasks();
      const task = currentTasks.find((item) => item.id === taskId);
      if (!task) throw new ApiError("not_found", "Pickup task not found");
      const currentAssignments = await repo.assignments();
      if (currentAssignments.some((item) => item.taskId === taskId)) {
        throw new ApiError("conflict", "Pickup task is already assigned");
      }
      const volunteer = await repo.findVolunteer(volunteerId);
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
      await repo.saveAssignment(assignment);
      await repo.saveTask({ ...task, status: "assigned" });
      await repo.audit(task.id, "pickup.task.assigned", actorId);
      return assignment;
    },

    async complete(taskId: string, volunteerId: string): Promise<PickupTask> {
      const currentTasks = await repo.tasks();
      const task = currentTasks.find((item) => item.id === taskId);
      if (!task) throw new ApiError("not_found", "Pickup task not found");
      const assignment = (await repo.assignments())
        .find((item) => item.taskId === taskId && item.volunteerId === volunteerId);
      if (!assignment) throw new ApiError("forbidden", "Only the assignee can complete a task");
      const completed: PickupTask = { ...task, status: "completed" };
      await repo.saveTask(completed);
      await repo.saveAssignment({ ...assignment, status: "completed" });
      await repo.audit(task.id, "pickup.task.completed", volunteerId);
      return completed;
    },
  };
}
