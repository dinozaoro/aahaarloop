import * as dal from "@/lib/data/dal";

import {
  createNotificationService,
  defaultPreferences,
} from "./service.ts";

export const notificationService = createNotificationService({
  all: (userId) => dal.listNotifications(userId ?? ""),
  save: dal.saveNotification,
  preferences: (userId) => dal.getNotificationPreferences(userId, defaultPreferences()),
  savePreferences: dal.saveNotificationPreferences,
});
