import { describe, expect, it } from "vitest";

import {
  parseEventDateTime,
  toEventDateTimeInputParts,
  toEventDateTimePayload,
} from "../../lib/format";

describe("event date/time helpers", () => {
  it("keeps organizer date and time as a local event schedule payload", () => {
    expect(toEventDateTimePayload("2026-07-07", "15:30")).toBe("2026-07-07T15:30:00");
  });

  it("parses Laravel-serialized event dates without shifting the displayed event time", () => {
    const parsed = parseEventDateTime("2026-07-07T15:30:00.000000Z");

    expect(parsed.getFullYear()).toBe(2026);
    expect(parsed.getMonth()).toBe(6);
    expect(parsed.getDate()).toBe(7);
    expect(parsed.getHours()).toBe(15);
    expect(parsed.getMinutes()).toBe(30);
  });

  it("fills edit form date and time fields without timezone conversion", () => {
    expect(toEventDateTimeInputParts("2026-07-07T15:30:00.000000Z")).toEqual({
      date: "2026-07-07",
      time: "15:30",
    });
  });
});
