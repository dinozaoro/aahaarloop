import { getVolunteerProfile } from "@/lib/data/store";

import type { PickupAssignment, PickupTask } from "../domain/types.ts";
import { createPickupService, type PickupRepository } from "./tasks.ts";

const tasks: PickupTask[] = [];
const assignments: PickupAssignment[] = [];
const trail: Array<{ taskId: string; action: string; actorId: string; at: string }> = [];

const repository: PickupRepository = {
  tasks: () => tasks,
  assignments: () => assignments,
  saveTask: (task) => {
    const index = tasks.findIndex((item) => item.id === task.id);
    if (index === -1) tasks.push(task);
    else tasks[index] = task;
  },
  saveAssignment: (assignment) => {
    const index = assignments.findIndex((item) => item.id === assignment.id);
    if (index === -1) assignments.push(assignment);
    else assignments[index] = assignment;
  },
  findVolunteer: (id) => {
    const profile = getVolunteerProfile();
    return profile?.id === id ? profile : undefined;
  },
  audit: (taskId, action, actorId) => {
    trail.push({ taskId, action, actorId, at: new Date().toISOString() });
  },
};

export const pickupService = createPickupService(repository);
export const pickupTrail = trail;
export const listPickupTasks = () => tasks;
