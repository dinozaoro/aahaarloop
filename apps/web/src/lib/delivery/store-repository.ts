import {
  getClaim,
  getDonation,
  upsertClaim,
  upsertDonation,
} from "@/lib/data/store";
import {
  listPickupAssignments,
  listPickupTasks,
} from "@/lib/pickups/store-repository";

import type { ImpactRecord } from "../domain/types.ts";
import { createDeliveryService, type DeliveryRepository } from "./service.ts";

const impacts: ImpactRecord[] = [];

const repository: DeliveryRepository = {
  findTask: (id) => listPickupTasks().find((task) => task.id === id),
  findAssignment: (taskId, volunteerId) =>
    listPickupAssignments().find(
      (item) => item.taskId === taskId && item.volunteerId === volunteerId,
    ),
  findClaim: (id) => getClaim(id),
  findDonation: (id) => getDonation(id),
  saveTask: (task) => {
    const current = listPickupTasks().find((item) => item.id === task.id);
    if (current) Object.assign(current, task);
  },
  saveAssignment: (assignment) => {
    const current = listPickupAssignments().find(
      (item) => item.id === assignment.id,
    );
    if (current) Object.assign(current, assignment);
  },
  saveClaim: (claim) => upsertClaim(claim),
  saveDonation: (donation) => upsertDonation(donation),
  saveImpact: (record) => impacts.push(record),
};

export const deliveryService = createDeliveryService(repository);
export const listImpactRecords = () => impacts;
