import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventItem, User } from "../../data/mockData";
import { EventFormDialog } from "../../components/EventFormDialog";

const toast = vi.hoisted(() => ({
  error: vi.fn(),
}));

const store = vi.hoisted(() => ({
  currentUser: { id: "organizer-1", name: "Organizer", email: "o@test.dev", role: "organizer" } as User,
  events: [] as EventItem[],
  createEvent: vi.fn(),
  updateEvent: vi.fn(),
}));

vi.mock("sonner", () => ({ toast }));
vi.mock("../../store/AppStore", () => ({
  useAppStore: () => store,
}));

const event = (overrides: Partial<EventItem>): EventItem => ({
  id: "event-default",
  organizerId: "organizer-1",
  title: "Photography Class",
  description: "Camera basics",
  venue: "Jose Rizal Building",
  eventDate: "2026-07-08T15:45:00",
  capacity: 10,
  status: "open",
  cover_image_path: "cover.jpg",
  registeredCount: 0,
  ...overrides,
});

describe("EventFormDialog UI", () => {
  beforeEach(() => {
    store.events = [];
    store.createEvent.mockReset();
    store.updateEvent.mockReset();
    toast.error.mockReset();
  });

  it("shows duplicate title warning while creating an event", async () => {
    const user = userEvent.setup();
    store.events = [event({ id: "existing", title: "Photography Class" })];

    render(React.createElement(EventFormDialog, { trigger: React.createElement("button", null, "New event") }));
    await user.click(screen.getByRole("button", { name: "New event" }));
    await user.type(screen.getByLabelText("Title"), "Photography Class");

    expect(screen.getByText(/already have an active event with this title/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create event" })).toBeDisabled();
  });

  it("prefills edit form fields from the selected event", () => {
    render(React.createElement(EventFormDialog, { event: event({ capacity: 25 }), open: true }));

    expect(screen.getByLabelText("Title")).toHaveValue("Photography Class");
    expect(screen.getByLabelText("Venue")).toHaveValue("Jose Rizal Building");
    expect(screen.getByLabelText("Date")).toHaveValue("2026-07-08");
    expect(screen.getByLabelText("Time")).toHaveValue("15:45");
    expect(screen.getByLabelText("Capacity")).toHaveValue(25);
  });

  it("rejects invalid thumbnail file types", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(EventFormDialog, { trigger: React.createElement("button", null, "New event") }),
    );
    await user.click(screen.getByRole("button", { name: "New event" }));

    const input = document.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    fireEvent.change(input as HTMLInputElement, {
      target: { files: [new File(["bad"], "document.pdf", { type: "application/pdf" })] },
    });

    expect(toast.error).toHaveBeenCalledWith("Only JPG, PNG, or WEBP images are allowed.");
  });
});
