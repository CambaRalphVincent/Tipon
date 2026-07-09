import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminEventMonitor } from "../../pages/AdminEventMonitor";
import type { ApiEvent } from "../../lib/api";
import { renderWithRouter } from "../testUtils";

const eventsApi = vi.hoisted(() => ({
  all: vi.fn(),
}));
const toast = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  eventsApi,
}));
vi.mock("sonner", () => ({ toast }));

const event = (overrides: Partial<ApiEvent>): ApiEvent => ({
  id: 1,
  organizer_id: 10,
  title: "Default Event",
  description: "Default description",
  venue: "Main Hall",
  event_date: "2026-07-20T08:00:00",
  capacity: 10,
  status: "open",
  cover_image_path: null,
  registered_count: 0,
  organizer: { id: 10, name: "Organizer One" },
  created_at: "2026-07-01T08:00:00.000Z",
  updated_at: "2026-07-01T08:00:00.000Z",
  ...overrides,
});

describe("AdminEventMonitor UI", () => {
  beforeEach(() => {
    eventsApi.all.mockReset();
    toast.error.mockReset();
  });

  it("loads platform events with organizer and capacity details", async () => {
    eventsApi.all.mockResolvedValue({
      data: [
        event({
          id: 1,
          title: "Open Forum",
          venue: "Auditorium",
          capacity: 20,
          registered_count: 20,
          organizer: { id: 11, name: "Dr. Reyes" },
        }),
        event({
          id: 2,
          title: "Cancelled Workshop",
          status: "cancelled",
          registered_count: 3,
          organizer: { id: 12, name: "Prof. Cole" },
        }),
      ],
    });

    renderWithRouter(React.createElement(AdminEventMonitor));

    expect(await screen.findByText("Open Forum")).toBeInTheDocument();
    expect(screen.getByText("Cancelled Workshop")).toBeInTheDocument();
    expect(screen.getByText("Dr. Reyes")).toBeInTheDocument();
    expect(screen.getByText("Prof. Cole")).toBeInTheDocument();
    expect(screen.getAllByText("Full")).toHaveLength(2);
    expect(screen.getByText("Total events").parentElement).toHaveTextContent("2");
    expect(screen.getByText("Full events").parentElement).toHaveTextContent("1");
  });

  it("filters events by status and search term", async () => {
    const user = userEvent.setup();
    eventsApi.all.mockResolvedValue({
      data: [
        event({ id: 1, title: "Open Forum", venue: "Auditorium", status: "open" }),
        event({ id: 2, title: "Cancelled Workshop", venue: "Lab", status: "cancelled" }),
      ],
    });

    renderWithRouter(React.createElement(AdminEventMonitor));

    expect(await screen.findByText("Open Forum")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cancelled/ }));
    expect(screen.queryByText("Open Forum")).not.toBeInTheDocument();
    expect(screen.getByText("Cancelled Workshop")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /All/ }));
    await user.type(screen.getByPlaceholderText("Search events, venues, organizers..."), "auditorium");

    expect(screen.getByText("Open Forum")).toBeInTheDocument();
    expect(screen.queryByText("Cancelled Workshop")).not.toBeInTheDocument();
  });

  it("shows an error toast when events cannot load", async () => {
    eventsApi.all.mockRejectedValue(new Error("failed"));

    renderWithRouter(React.createElement(AdminEventMonitor));

    await screen.findByText("No events match this view.");
    expect(toast.error).toHaveBeenCalledWith("Failed to load events.");
  });
});
