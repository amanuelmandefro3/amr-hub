import prisma from "../../prisma/client";
import type {
  Notification,
  NotificationType,
} from "../app/data/notifications";

function serializeNotification(notification: {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: Date | null;
  issueId: string | null;
  projectId: string | null;
  createdAt: Date;
}): Notification {
  return {
    id: notification.id,
    type: notification.type as NotificationType,
    title: notification.title,
    body: notification.body,
    isRead: notification.readAt !== null,
    issueId: notification.issueId,
    projectId: notification.projectId,
    createdAt: notification.createdAt.toISOString(),
  };
}

export type NotifyInput = {
  type: NotificationType;
  title: string;
  body: string;
  organizationId: string;
  projectId?: string | null;
  issueId?: string | null;
  actorId?: string | null;
};

export async function notifyRecipients(
  recipientUserIds: (string | null | undefined)[],
  input: NotifyInput,
) {
  const recipients = [...new Set(recipientUserIds.filter(Boolean))].filter(
    (userId) => userId !== input.actorId,
  ) as string[];

  if (recipients.length === 0) return;

  await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      body: input.body,
      organizationId: input.organizationId,
      projectId: input.projectId ?? null,
      issueId: input.issueId ?? null,
      actorId: input.actorId ?? null,
    })),
  });
}

export type NotificationListFilters = {
  cursor?: string;
  limit?: number;
};

export async function listNotifications(
  userId: string,
  filters: NotificationListFilters = {},
) {
  const limit = filters.limit ?? 20;

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(filters.cursor
        ? { cursor: { id: filters.cursor }, skip: 1 }
        : {}),
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  let nextCursor: string | null = null;
  let page = notifications;
  if (notifications.length > limit) {
    page = notifications.slice(0, limit);
    nextCursor = page[page.length - 1].id;
  }

  return {
    notifications: page.map(serializeNotification),
    unreadCount,
    nextCursor,
  };
}

export async function markNotificationRead(id: string, userId: string) {
  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });
  if (!notification) return null;

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: notification.readAt ?? new Date() },
  });

  return serializeNotification(updated);
}

export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
