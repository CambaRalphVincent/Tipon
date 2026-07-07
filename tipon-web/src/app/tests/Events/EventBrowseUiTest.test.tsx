import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventItem, Registration } from "../../data/mockData";
import { EventCard } from "../../components/EventCard";
import { EventsBrowse } from "../../pages/EventsBrowse";
import { renderWithRouter } from "../testUtils";

const store = vi.hoisted(() => ({
  events: [] as EventItem[],
  confirmedCountFor: vi.fn(),
  isFull: vi.fn(),
  registrationFor: vi.fn(),
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
  registeredCount: 0,
  ...overrides,
});

describe("Browse Events UI", () => {
  beforeEach(() => {
    store.events = [];
    store.confirmedCountFor.mockReturnValue(0);
    store.isFull.mockReturnValue(false);
    store.registrationFor.mockReturnValue(undefined);
  });

  it("updates visible event cards from search input and shows empty state", async () => {
    const user = userEvent.setup();
    store.events = [
      event({ id: "photography", title: "Photography Class", description: "Camera basics" }),
      event({ id: "assembly", title: "Assembly Language", venue: "Gabriela Silang Building" }),
    ];

    renderWithRouter(React.createElement(EventsBrowse));

    expect(screen.getByText("Photography Class")).toBeInTheDocument();
    expect(screen.getByText("Assembly Language")).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("Search events, venues..."), "camera");

    expect(screen.getByText("Photography Class")).toBeInTheDocument();
    expect(screen.queryByText("Assembly Language")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search events, venues..."));
    await user.type(screen.getByPlaceholderText("Search events, venues..."), "no match");

    expect(screen.getByText("No events found")).toBeInTheDocument();
  });

  it("shows registered and full badges on event cards", () => {
    const registered: Registration = {
      id: "reg-1",
      eventId: "event-1",
      userId: "user-1",
      status: "registered",
      attendance: "pending",
      createdAt: "2026-07-07T08:00:00.000Z",
    };

    store.registrationFor.mockReturnValueOnce(registered);
    renderWithRouter(React.createElement(EventCard, { event: event({ id: "event-1" }) }));
    expect(screen.getByText("Registered")).toBeInTheDocument();

    store.registrationFor.mockReturnValue(undefined);
    store.isFull.mockReturnValue(true);
    renderWithRouter(React.createElement(EventCard, { event: event({ id: "event-2" }) }));
    expect(screen.getByText("Full")).toBeInTheDocument();
  });
});
