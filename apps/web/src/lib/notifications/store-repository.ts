import {
  createNotificationService,
  defaultPreferences,
  type Notification,
  type NotificationPreferences,
  type NotificationRepository,
} from "./service.ts";

const rows: Notification[] = [];
const preferences = new Map<string, NotificationPreferences>();

const repository: NotificationRepository = {
  all: () => rows,
  save: (notification) => {
    const index = rows.findIndex((item) => item.id === notification.id);
    if (index === -1) rows.push(notification);
    else rows[index] = notification;
  },
  preferences: (userId) => preferences.get(userId) ?? defaultPreferences(),
  savePreferences: (userId, value) => {
    preferences.set(userId, value);
  },
};

export const notificationService = createNotificationService(repository);
