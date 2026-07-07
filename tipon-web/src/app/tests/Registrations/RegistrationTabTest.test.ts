import { describe, expect, it, vi } from "vitest";

import type { EventItem, Registration } from "../../data/mockData";
import { getRegistrationTabItems } from "../../lib/myRegistrations";

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
  registeredCount: 1,
  ...overrides,
});

describe("getRegistrationTabItems", () => {
  it("categorizes registrations into upcoming, past, and cancelled tabs", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-07T12:00:00"));

    try {
      const tabs = getRegistrationTabItems([
        {
          reg: registration({ id: "upcoming", eventId: "future" }),
          event: event({ id: "future", eventDate: "2026-07-08T08:00:00" }),
        },
        {
          reg: registration({ id: "past", eventId: "past" }),
          event: event({ id: "past", eventDate: "2026-07-07T08:00:00" }),
        },
        {
          reg: registration({ id: "cancelled", eventId: "cancelled", status: "cancelled" }),
          event: event({ id: "cancelled", eventDate: "2026-07-08T08:00:00" }),
        },
      ], new Date("2026-07-07T12:00:00.000Z").getTime());

      expect(tabs.upcoming.map((item) => item.reg.id)).toEqual(["upcoming"]);
      expect(tabs.past.map((item) => item.reg.id)).toEqual(["past"]);
      expect(tabs.cancelled.map((item) => item.reg.id)).toEqual(["cancelled"]);
    } finally {
      vi.useRealTimers();
    }
  });
});
