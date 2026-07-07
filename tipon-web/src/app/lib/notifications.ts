import type { AppNotification } from "../data/mockData";

export function getNotificationsForUser(
  notifications: AppNotification[],
  userId: string | undefined,
): AppNotification[] {
  return notifications
    .filter((notification) => notification.userId === (userId ?? ""))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export function getUnreadNotificationCount(notifications: AppNotification[]): number {
  return notifications.filter((notification) => !notification.readAt).length;
}
