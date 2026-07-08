import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventItem, Registration, User } from "../../data/mockData";
import { MyRegistrations } from "../../pages/MyRegistrations";

const store = vi.hoisted(() => ({
  currentUser: { id: "user-1", name: "Participant User", email: "p@test.dev", role: "participant" } as User,
  registrations: [] as Registration[],
  events: [] as EventItem[],
  eventById: vi.fn(),
  cancelRegistration: vi.fn(),
  confirmedCountFor: vi.fn(),
}));

vi.mock("../../store/AppStore", () => ({
  useAppStore: () => store,
}));

const event = (overrides: Partial<EventItem>): EventItem => ({
  id: "event-default",
  organizerId: "organizer-1",
  title: "Default Event",
  description: "Default description",
  venue: "Default Venue",
  eventDate: "2000-07-07T08:00:00",
  capacity: 10,
  status: "open",
  cover_image_path: "cover.jpg",
  registeredCount: 1,
  ...overrides,
});

const registration = (overrides: Partial<Registration>): Registration => ({
  id: "reg-default",
  eventId: "event-default",
  userId: "user-1",
  status: "registered",
  attendance: "pending",
  createdAt: "2026-07-07T08:00:00.000Z",
  updatedAt: "2026-07-07T08:00:00.000Z",
  ...overrides,
});

describe("Attendance UI", () => {
  beforeEach(() => {
    store.eventById.mockReset();
    store.confirmedCountFor.mockReturnValue(1);
  });

  it("shows attendance badges in the Past Events tab", async () => {
    const user = userEvent.setup();
    const events = [
      event({ id: "present-event", title: "Present Event" }),
      event({ id: "absent-event", title: "Absent Event" }),
      event({ id: "pending-event", title: "Pending Event" }),
    ];
    store.registrations = [
      registration({ id: "present", eventId: "present-event", attendance: "present" }),
      registration({ id: "absent", eventId: "absent-event", attendance: "absent" }),
      registration({ id: "pending", eventId: "pending-event", attendance: "pending" }),
    ];
    store.eventById.mockImplementation((id: string) => events.find((item) => item.id === id));

    render(React.createElement(MyRegistrations));
    await user.click(screen.getByRole("tab", { name: /Past Events/ }));

    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.getByText("Absent")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});
