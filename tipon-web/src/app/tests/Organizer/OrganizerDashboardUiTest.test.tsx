import React from "react";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventItem, Registration, User } from "../../data/mockData";
import { OrganizerDashboard } from "../../pages/OrganizerDashboard";
import { renderWithRouter } from "../testUtils";

const store = vi.hoisted(() => ({
  currentUser: { id: "org-1", name: "Organizer One", email: "o@tipon.test", role: "organizer" } as User,
  events: [] as EventItem[],
  registrations: [] as Registration[],
  confirmedCountFor: vi.fn(),
}));

vi.mock("recharts", () => ({
  Bar: () => null,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CartesianGrid: () => null,
  Cell: () => null,
  Pie: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock("../../store/AppStore", () => ({
  useAppStore: () => store,
}));

const event = (overrides: Partial<EventItem>): EventItem => ({
  id: "event-default",
  organizerId: "org-1",
  title: "Default Event",
  description: "Default description",
  venue: "Default Venue",
  eventDate: "2026-07-08T08:00:00",
  capacity: 10,
  status: "open",
  cover_image_path: "cover.jpg",
  registeredCount: 0,
  ...overrides,
});

const reg = (overrides: Partial<Registration>): Registration => ({
  id: "registration-default",
  eventId: "event-default",
  userId: "user-1",
  status: "registered",
  attendance: "pending",
  createdAt: "2026-07-07T08:00:00.000Z",
  ...overrides,
});

const setCardValue = (label: string) => {
  const labelNode = screen.getByText(label);
  return labelNode.parentElement?.querySelector("p.text-2xl") as HTMLParagraphElement;
};

describe("OrganizerDashboard UI", () => {
  beforeEach(() => {
    store.events = [];
    store.registrations = [];
    store.confirmedCountFor.mockReset().mockReturnValue(0);
  });

  it("shows only events owned by the logged-in organizer", async () => {
    store.events = [
      event({ id: "mine-open", title: "My Open Event" }),
      event({ id: "other", title: "Other Organizer Event", organizerId: "org-2" }),
    ];
    store.confirmedCountFor.mockReturnValue(5);

    renderWithRouter(React.createElement(OrganizerDashboard));

    expect(await screen.findByText("My Open Event")).toBeInTheDocument();
    expect(screen.queryByText("Other Organizer Event")).not.toBeInTheDocument();
    expect(screen.getByText("Total capacity")).toHaveTextContent("Total capacity");
  });

  it("calculates active events, total registrations, capacity, and remaining slots", () => {
    store.events = [
      event({ id: "open-a", title: "Open A", eventDate: "2026-07-10T10:00:00", capacity: 10 }),
      event({ id: "open-b", title: "Open B", eventDate: "2026-07-11T10:00:00", capacity: 20, registeredCount: 4 }),
      event({ id: "completed", title: "Completed", status: "completed", capacity: 8, registeredCount: 8 }),
    ];
    store.registrations = [
      reg({ id: "r1", eventId: "open-a", attendance: "present", userId: "u1" }),
      reg({ id: "r2", eventId: "open-a", attendance: "absent", userId: "u2" }),
      reg({ id: "r3", eventId: "open-b", attendance: "pending", userId: "u3" }),
      reg({ id: "r4", eventId: "open-b", attendance: "pending", userId: "u4" }),
      reg({ id: "r5", eventId: "completed", attendance: "present", userId: "u5" }),
    ];
    store.confirmedCountFor.mockImplementation((eventId: string) => {
      if (eventId === "open-a") return 2;
      if (eventId === "open-b") return 2;
      if (eventId === "completed") return 2;
      return 0;
    });

    renderWithRouter(React.createElement(OrganizerDashboard));

    expect(setCardValue("Active events")).toHaveTextContent("2");
    expect(setCardValue("Total registrations")).toHaveTextContent("5");
    expect(setCardValue("Total capacity")).toHaveTextContent("30");
    expect(setCardValue("Attendance rate")).toHaveTextContent("67%");
  });

  it("calculates attendance rate correctly", () => {
    store.events = [event({ id: "open", title: "Open Event" })];
    store.registrations = [
      reg({ eventId: "open", attendance: "present", userId: "u1" }),
      reg({ id: "reg-2", eventId: "open", attendance: "absent", userId: "u2" }),
      reg({ id: "reg-3", eventId: "open", attendance: "pending", userId: "u3" }),
    ];
    store.confirmedCountFor.mockReturnValue(1);

    renderWithRouter(React.createElement(OrganizerDashboard));

    expect(setCardValue("Attendance rate")).toHaveTextContent("50%");
  });

  it("shows empty active-event message when organizer has no open events", async () => {
    store.events = [event({ id: "completed", status: "completed", title: "Only completed", eventDate: "2026-07-01T10:00:00" })];

    renderWithRouter(React.createElement(OrganizerDashboard));

    expect(await screen.findByText(/No active upcoming events/)).toBeInTheDocument();
  });

  it("orders upcoming organizer events by schedule", () => {
    store.events = [
      event({
        id: "late",
        title: "Late Event",
        eventDate: "2026-07-12T10:00:00",
        capacity: 15,
      }),
      event({
        id: "early",
        title: "Early Event",
        eventDate: "2026-07-10T10:00:00",
        capacity: 16,
      }),
      event({
        id: "middle",
        title: "Middle Event",
        eventDate: "2026-07-11T10:00:00",
        capacity: 17,
      }),
    ];
    store.confirmedCountFor.mockReturnValue(0);

    renderWithRouter(React.createElement(OrganizerDashboard));

    const early = screen.getByText("Early Event");
    const middle = screen.getByText("Middle Event");
    const late = screen.getByText("Late Event");

    expect(early.compareDocumentPosition(middle) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(middle.compareDocumentPosition(late) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
