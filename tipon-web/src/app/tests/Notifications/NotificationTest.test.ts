import { describe, expect, it } from "vitest";

import type { AppNotification } from "../../data/mockData";
import { getNotificationsForUser, getUnreadNotificationCount } from "../../lib/notifications";

const notification = (overrides: Partial<AppNotification>): AppNotification => ({
  id: "notification-default",
  type: "registration_confirmed",
  userId: "user-1",
  title: "Default notification",
  body: "Default body",
  readAt: null,
  createdAt: "2026-07-07T08:00:00.000Z",
  ...overrides,
});

describe("notifications", () => {
  it("returns only the current user's notifications newest first", () => {
    const mine = getNotificationsForUser([
      notification({ id: "older", createdAt: "2026-07-07T08:00:00.000Z" }),
      notification({ id: "other-user", userId: "user-2", createdAt: "2026-07-07T10:00:00.000Z" }),
      notification({ id: "newer", createdAt: "2026-07-07T11:00:00.000Z" }),
    ], "user-1");

    expect(mine.map((item) => item.id)).toEqual(["newer", "older"]);
  });

  it("counts unread notifications", () => {
    expect(getUnreadNotificationCount([
      notification({ id: "unread", readAt: null }),
      notification({ id: "read", readAt: "2026-07-07T12:00:00.000Z" }),
    ])).toBe(1);
  });
});
