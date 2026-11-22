import { recordAudit } from "@/lib/audit/log";
import * as dal from "@/lib/data/dal";
import { getDb } from "@/lib/db";

import { createPickupService, type PickupRepository } from "./tasks.ts";

const repository: PickupRepository = {
  tasks: dal.listPickupTasks,
  assignments: dal.listPickupAssignments,
  saveTask: dal.savePickupTask,
  saveAssignment: dal.savePickupAssignment,
  findVolunteer: dal.findVolunteerProfile,
  audit: async (taskId, action, actorId) => {
    await recordAudit(await getDb(), {
      actorType: "volunteer",
      actorId,
      action,
      entityType: "pickup_task",
      entityId: taskId,
    });
  },
};

export const pickupService = createPickupService(repository);

export const listPickupTasks = dal.listPickupTasks;
