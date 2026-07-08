import { describe, expect, it } from "vitest";

import type { Registration } from "../../data/mockData";
import {
  getRegistrationTabSummary,
  getVisibleCancelledRegistrationItems,
} from "../../lib/myRegistrations";

const registration = (overrides: Partial<Registration>): Registration => ({
  id: "reg-default",
  eventId: "event-default",
  userId: "user-1",
  status: "cancelled",
  attendance: "pending",
  createdAt: "2026-07-07T08:00:00.000Z",
  updatedAt: "2026-07-07T08:00:00.000Z",
  ...overrides,
});

describe("getVisibleCancelledRegistrationItems", () => {
  const now = new Date("2026-07-07T12:00:00.000Z").getTime();

  it("shows only the latest recent cancelled registration per event", () => {
    const items = [
      { reg: registration({ id: "old", eventId: "event-1", updatedAt: "2026-07-07T08:00:00.000Z" }) },
      { reg: registration({ id: "latest", eventId: "event-1", updatedAt: "2026-07-07T11:00:00.000Z" }) },
    ];

    expect(getVisibleCancelledRegistrationItems(items, now).map((item) => item.reg.id)).toEqual(["latest"]);
  });

  it("hides cancelled history while the participant is currently registered for the same event", () => {
    const items = [
      { reg: registration({ id: "cancelled", eventId: "event-1" }) },
      { reg: registration({ id: "active", eventId: "event-1", status: "registered" }) },
    ];

    expect(getVisibleCancelledRegistrationItems(items, now)).toEqual([]);
  });

  it("hides cancelled registrations after one day", () => {
    const items = [
      { reg: registration({ id: "recent", eventId: "event-1", updatedAt: "2026-07-07T08:00:00.000Z" }) },
      { reg: registration({ id: "old", eventId: "event-2", updatedAt: "2026-07-06T11:59:00.000Z" }) },
    ];

    expect(getVisibleCancelledRegistrationItems(items, now).map((item) => item.reg.id)).toEqual(["recent"]);
  });
});

describe("getRegistrationTabSummary", () => {
  it("returns tab-specific summary text", () => {
    const counts = { upcoming: 3, past: 1, cancelled: 0 };

    expect(getRegistrationTabSummary("upcoming", counts)).toBe("Showing 3 upcoming events.");
    expect(getRegistrationTabSummary("past", counts)).toBe("Showing 1 past event.");
    expect(getRegistrationTabSummary("cancelled", counts)).toBe("Showing 0 recent cancellations.");
  });
});
