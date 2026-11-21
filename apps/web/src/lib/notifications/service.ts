import { ApiError } from "../api/errors.ts";

export const NOTIFICATION_TYPES = [
  "claim_created",
  "claim_cancelled",
  "claim_expired",
  "pickup_assigned",
  "pickup_completed",
  "delivered",
  "deadline_approaching",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export type NotificationChannel = "in_app" | "email" | "push";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  dedupeKey: string;
  data?: Record<string, unknown>;
  readAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

export interface NotificationPreferences {
  channel: NotificationChannel;
  enabled: Record<NotificationType, boolean>;
}

export function defaultPreferences(): NotificationPreferences {
  return {
    channel: "in_app",
    enabled: Object.fromEntries(
      NOTIFICATION_TYPES.map((type) => [type, true]),
    ) as Record<NotificationType, boolean>,
  };
}

/** Out-of-band delivery hook; in-app storage always happens regardless. */
export interface NotificationAdapter {
  readonly channel: NotificationChannel;
  send(notification: Notification): Promise<void>;
}

export interface NotificationRepository {
  all(): readonly Notification[];
  save(notification: Notification): void;
  preferences(userId: string): NotificationPreferences;
  savePreferences(userId: string, preferences: NotificationPreferences): void;
}

export interface NotifyInput {
  type: NotificationType;
  title: string;
  body: string;
  entityType: string;
  entityId: string;
  recipients: readonly string[];
  data?: Record<string, unknown>;
}

export interface NotificationOptions {
  now?: () => string;
  dedupeWindowMs?: number;
  adapters?: Partial<Record<NotificationChannel, NotificationAdapter>>;
}

export function createNotificationService(
  repo: NotificationRepository,
  options: NotificationOptions = {},
) {
  const now = options.now ?? (() => new Date().toISOString());
  const dedupeWindowMs = options.dedupeWindowMs ?? 10 * 60 * 1000;
  const adapters = options.adapters ?? {};

  return {
    async notify(input: NotifyInput): Promise<Notification[]> {
      const created: Notification[] = [];
      for (const userId of new Set(input.recipients)) {
        const prefs = repo.preferences(userId);
        if (!prefs.enabled[input.type]) continue;
        const dedupeKey = `${input.type}:${input.entityId}:${userId}`;
        const duplicate = repo
          .all()
          .some(
            (item) =>
              item.dedupeKey === dedupeKey &&
              Date.parse(now()) - Date.parse(item.createdAt) < dedupeWindowMs,
          );
        if (duplicate) continue;

        const notification: Notification = {
          id: crypto.randomUUID(),
          userId,
          type: input.type,
          title: input.title,
          body: input.body,
          entityType: input.entityType,
          entityId: input.entityId,
          dedupeKey,
          ...(input.data ? { data: input.data } : {}),
          readAt: null,
          sentAt: null,
          createdAt: now(),
        };
        repo.save(notification);
        const adapter = adapters[prefs.channel];
        if (adapter) await adapter.send(notification);
        created.push(notification);
      }
      return created;
    },

    list(
      userId: string,
      filters: { unreadOnly?: boolean; page?: number; pageSize?: number } = {},
    ) {
      const page = Math.max(1, filters.page ?? 1);
      const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
      const own = repo
        .all()
        .filter(
          (item) =>
            item.userId === userId && (!filters.unreadOnly || item.readAt === null),
        )
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
      return {
        page,
        pageSize,
        total: own.length,
        unread: own.filter((item) => item.readAt === null).length,
        data: own.slice((page - 1) * pageSize, page * pageSize),
      };
    },

    markRead(id: string, userId: string): Notification {
      const notification = repo.all().find((item) => item.id === id);
      if (!notification) throw new ApiError("not_found", "Notification not found");
      if (notification.userId !== userId) {
        throw new ApiError("forbidden", "Notification belongs to another user");
      }
      const read = { ...notification, readAt: now() };
      repo.save(read);
      return read;
    },

    markAllRead(userId: string): number {
      let count = 0;
      for (const item of repo.all()) {
        if (item.userId === userId && item.readAt === null) {
          repo.save({ ...item, readAt: now() });
          count++;
        }
      }
      return count;
    },

    getPreferences(userId: string): NotificationPreferences {
      return repo.preferences(userId);
    },

    updatePreferences(
      userId: string,
      patch: {
        channel?: NotificationChannel;
        enabled?: Partial<Record<NotificationType, boolean>>;
      },
    ): NotificationPreferences {
      const current = repo.preferences(userId);
      const next: NotificationPreferences = {
        channel: patch.channel ?? current.channel,
        enabled: { ...current.enabled, ...(patch.enabled ?? {}) },
      };
      repo.savePreferences(userId, next);
      return next;
    },
  };
}
