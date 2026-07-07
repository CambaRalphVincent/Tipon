import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { AppNotification, User } from "../../data/mockData";
import { NotificationBell } from "../../components/NotificationBell";
import { renderWithRouter } from "../testUtils";

const store = vi.hoisted(() => ({
  currentUser: { id: "user-1", name: "Participant", email: "p@test.dev", role: "participant" } as User,
  notifications: [] as AppNotification[],
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
}));

vi.mock("../../store/AppStore", () => ({
  useAppStore: () => store,
}));

const notification = (overrides: Partial<AppNotification>): AppNotification => ({
  id: "notification-default",
  type: "registration_confirmed",
  userId: "user-1",
  title: "Registration confirmed",
  body: "You are registered.",
  readAt: null,
  createdAt: "2026-07-07T08:00:00.000Z",
  ...overrides,
});

describe("NotificationBell UI", () => {
  beforeEach(() => {
    store.notifications = [];
    store.markNotificationRead.mockReset();
    store.markAllNotificationsRead.mockReset();
  });

  it("shows unread count and mark all read action", async () => {
    const user = userEvent.setup();
    store.notifications = [
      notification({ id: "one", title: "First unread" }),
      notification({ id: "two", title: "Second unread" }),
    ];

    renderWithRouter(React.createElement(NotificationBell));

    expect(screen.getByText("2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    await user.click(screen.getByRole("button", { name: "Mark all read" }));

    expect(store.markAllNotificationsRead).toHaveBeenCalledTimes(1);
  });

  it("marks a clicked notification as read", async () => {
    const user = userEvent.setup();
    store.notifications = [notification({ id: "notif-1", title: "Registration confirmed" })];

    renderWithRouter(React.createElement(NotificationBell));

    await user.click(screen.getByRole("button", { name: "Notifications" }));
    await user.click(screen.getByRole("button", { name: /Registration confirmed/ }));

    expect(store.markNotificationRead).toHaveBeenCalledWith("notif-1");
  });

  it("hides mark all read when there are no unread notifications", async () => {
    const user = userEvent.setup();
    store.notifications = [
      notification({
        id: "read",
        title: "Already read",
        readAt: "2026-07-07T09:00:00.000Z",
      }),
    ];

    renderWithRouter(React.createElement(NotificationBell));

    await user.click(screen.getByRole("button", { name: "Notifications" }));

    expect(screen.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
  });
});
