import { describe, expect, it } from "vitest";

import type { EventItem } from "../../data/mockData";
import { hasDuplicateOpenEventTitleForOrganizer } from "../../lib/eventFilters";
import { toEventDateTimeInputParts, toEventDateTimePayload } from "../../lib/format";

const event = (overrides: Partial<EventItem>): EventItem => ({
  id: "event-default",
  organizerId: "organizer-1",
  title: "Photography Class",
  description: "Default description",
  venue: "Default Venue",
  eventDate: "2099-01-01T08:00:00",
  capacity: 10,
  status: "open",
  cover_image_path: "",
  registeredCount: 0,
  ...overrides,
});

describe("organizer event management", () => {
  it("detects duplicate open event titles for the same organizer", () => {
    expect(
      hasDuplicateOpenEventTitleForOrganizer(
        [event({ id: "existing", title: "Photography Class" })],
        "organizer-1",
        " photography class ",
      ),
    ).toBe(true);
  });

  it("ignores duplicate titles for cancelled events and other organizers", () => {
    const events = [
      event({ id: "cancelled", title: "Photography Class", status: "cancelled" }),
      event({ id: "other-organizer", title: "Photography Class", organizerId: "organizer-2" }),
    ];

    expect(hasDuplicateOpenEventTitleForOrganizer(events, "organizer-1", "Photography Class")).toBe(false);
  });

  it("keeps the organizer-selected local event time in payloads and edit form values", () => {
    expect(toEventDateTimePayload("2026-07-08", "15:45")).toBe("2026-07-08T15:45:00");
    expect(toEventDateTimeInputParts("2026-07-08T15:45:00.000000Z")).toEqual({
      date: "2026-07-08",
      time: "15:45",
    });
  });
});
