import * as dal from "@/lib/data/dal";
import { getDb } from "@/lib/db";
import { recordAudit } from "@/lib/audit/log";

import {
  createModerationService,
  type ModerationRepository,
} from "./reports.ts";

const repository: ModerationRepository = {
  all: dal.listModerationReports,
  find: dal.findModerationReport,
  save: dal.saveModerationReport,
};

export const moderationService = createModerationService(repository, async (input) => {
  await recordAudit(await getDb(), {
    actorType: "admin",
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    after: input.after,
  });
});
