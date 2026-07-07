import { describe, expect, it, vi } from "vitest";

import type { EventItem } from "../../data/mockData";
import { getVisibleBrowseEvents } from "../../lib/eventFilters";

const event = (overrides: Partial<EventItem>): EventItem => ({
  id: "event-default",
  organizerId: "organizer-1",
  title: "Default Event",
  description: "Default description",
  venue: "Default Venue",
  eventDate: "2099-01-01T08:00:00",
  capacity: 10,
  status: "open",
  cover_image_path: "",
  registeredCount: 0,
  ...overrides,
});

describe("getVisibleBrowseEvents", () => {
  it("hides past events", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T12:00:00"));

    try {
      const visible = getVisibleBrowseEvents([
        event({ id: "past", eventDate: "2026-07-07T08:00:00" }),
        event({ id: "future", eventDate: "2026-07-08T08:00:00" }),
      ], "");

      expect(visible.map((item) => item.id)).toEqual(["future"]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("searches by title, description, and venue", () => {
    const events = [
      event({ id: "title", title: "Cybersecurity" }),
      event({ id: "description", description: "Learn camera basics" }),
      event({ id: "venue", venue: "Gabriela Silang Building" }),
    ];

    expect(getVisibleBrowseEvents(events, "cyber").map((item) => item.id)).toEqual(["title"]);
    expect(getVisibleBrowseEvents(events, "camera").map((item) => item.id)).toEqual(["description"]);
    expect(getVisibleBrowseEvents(events, "silang").map((item) => item.id)).toEqual(["venue"]);
  });

  it("sorts upcoming events by schedule", () => {
    const visible = getVisibleBrowseEvents([
      event({ id: "later", eventDate: "2099-01-02T08:00:00" }),
      event({ id: "earlier", eventDate: "2099-01-01T08:00:00" }),
    ], "");

    expect(visible.map((item) => item.id)).toEqual(["earlier", "later"]);
  });
});
