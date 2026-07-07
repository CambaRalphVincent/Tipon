import React from "react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
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
  eventDate: "2099-01-01T08:00:00",
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

function loadStore(events: EventItem[], registrations: Registration[]) {
  store.events = events;
  store.registrations = registrations;
  store.eventById.mockImplementation((id: string) => events.find((item) => item.id === id));
  store.confirmedCountFor.mockReturnValue(1);
}

describe("My Registrations UI", () => {
  beforeEach(() => {
    store.eventById.mockReset();
    store.cancelRegistration.mockReset();
    store.confirmedCountFor.mockReset();
  });

  it("renders only the active tab's cards and switches tabs", async () => {
    const user = userEvent.setup();
    loadStore(
      [
        event({ id: "upcoming", title: "Upcoming Event", eventDate: "2099-07-08T08:00:00" }),
        event({ id: "past", title: "Past Event", eventDate: "2000-07-07T08:00:00" }),
      ],
      [
        registration({ id: "upcoming-reg", eventId: "upcoming" }),
        registration({ id: "past-reg", eventId: "past", attendance: "present" }),
      ],
    );

    render(React.createElement(MyRegistrations));

    expect(screen.getByText("Upcoming Event")).toBeInTheDocument();
    expect(screen.queryByText("Past Event")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Past/ }));

    expect(screen.getByText("Past Event")).toBeInTheDocument();
    expect(screen.queryByText("Upcoming Event")).not.toBeInTheDocument();
    expect(screen.getByText("Present")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("does not show cancellation controls in the cancelled tab", async () => {
    const user = userEvent.setup();
    loadStore(
      [event({ id: "cancelled", title: "Cancelled Event", eventDate: "2099-07-08T08:00:00" })],
      [
        registration({
          id: "cancelled-reg",
          eventId: "cancelled",
          status: "cancelled",
          updatedAt: new Date().toISOString(),
        }),
      ],
    );

    render(React.createElement(MyRegistrations));
    await user.click(screen.getByRole("tab", { name: /Cancelled/ }));

    expect(screen.getByText("Cancelled Event")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
  });

  it("eager-loads the first three card images and lazy-loads later cards", () => {
    const events = Array.from({ length: 4 }, (_, index) =>
      event({ id: `event-${index}`, title: `Event ${index}`, eventDate: `2099-07-0${index + 8}T08:00:00` }),
    );
    const registrations = events.map((item, index) =>
      registration({ id: `reg-${index}`, eventId: item.id }),
    );
    loadStore(events, registrations);

    render(React.createElement(MyRegistrations));

    const images = screen.getAllByRole("img");
    expect(images[0]).toHaveAttribute("loading", "eager");
    expect(images[1]).toHaveAttribute("loading", "eager");
    expect(images[2]).toHaveAttribute("loading", "eager");
    expect(images[3]).toHaveAttribute("loading", "lazy");
  });
});
