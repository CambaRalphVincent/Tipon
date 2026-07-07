import React from "react";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EventCard } from "../../components/EventCard";
import { renderWithRouter } from "../testUtils";
import type { EventItem } from "../../data/mockData";

const store = vi.hoisted(() => ({
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
  title: "Sample Event",
  description: "Sample description",
  venue: "Main Hall",
  eventDate: "2026-07-08T08:00:00",
  capacity: 10,
  status: "open",
  cover_image_path: "cover.jpg",
  ...overrides,
});

describe("EventCard", () => {
  beforeEach(() => {
    store.confirmedCountFor.mockReset().mockReturnValue(2);
    store.isFull.mockReset().mockReturnValue(false);
    store.registrationFor.mockReset();
  });

  it("shows registered badge when participant is registered", () => {
    store.registrationFor.mockReturnValue({
      id: "reg-1",
      eventId: "event-default",
      userId: "user-1",
      status: "registered",
      attendance: "pending",
      createdAt: "2026-07-01T08:00:00.000Z",
      updatedAt: "2026-07-01T08:00:00.000Z",
    });

    renderWithRouter(React.createElement(EventCard, { event: event({ id: "event-default" }) }));

    expect(screen.getByText("Registered")).toBeInTheDocument();
  });

  it("shows full state when event has no remaining slots", () => {
    store.isFull.mockReturnValue(true);
    renderWithRouter(React.createElement(EventCard, { event: event({ id: "event-full", title: "No Slots" }) }));

    expect(screen.getByText("Full")).toBeInTheDocument();
  });

  it("uses lazy image loading when requested", () => {
    renderWithRouter(
      React.createElement(EventCard, { event: event({ id: "event-lazy", title: "Lazy Event" }), loading: "lazy" }),
    );

    const image = screen.getByAltText("Lazy Event") as HTMLImageElement;
    expect(image).toHaveAttribute("loading", "lazy");
  });

  it("renders cancelled/completed status clearly", () => {
    renderWithRouter(React.createElement(EventCard, { event: event({ id: "event-cancelled", status: "cancelled" }) }));
    expect(screen.getByText("Cancelled")).toBeInTheDocument();

    renderWithRouter(React.createElement(EventCard, { event: event({ id: "event-completed", status: "completed" }) }));
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
