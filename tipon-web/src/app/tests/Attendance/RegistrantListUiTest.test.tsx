import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RegistrantList } from "../../pages/RegistrantList";
import type { ApiRegistration, ApiUser } from "../../lib/api";
import type { EventStatus, EventItem } from "../../data/mockData";
const store = vi.hoisted(() => ({
  eventById: vi.fn(),
  recordAttendance: vi.fn(),
}));

const registrationsApi = vi.hoisted(() => ({
  eventRegistrations: vi.fn(),
}));

vi.mock("../../store/AppStore", () => ({
  adaptRegistration: (r: ApiRegistration) => ({
    id: String(r.id),
    eventId: String(r.event_id),
    userId: String(r.user_id),
    status: r.status,
    attendance: r.attendance,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }),
  useAppStore: () => store,
}));
vi.mock("../../lib/api", () => ({
  registrationsApi,
}));

const userFixture = (id: number, name: string, email: string): ApiUser => ({
  id,
  name,
  email,
  role: "participant",
  email_verified_at: null,
  created_at: "2026-07-01T08:00:00.000Z",
  updated_at: "2026-07-01T08:00:00.000Z",
});

const registration = (overrides: Partial<ApiRegistration>): ApiRegistration => ({
  id: 1,
  event_id: 1,
  user_id: 10,
  status: "registered",
  attendance: "pending",
  created_at: "2026-07-01T08:00:00.000Z",
  updated_at: "2026-07-01T08:00:00.000Z",
  ...overrides,
});

const eventItem = (status: EventStatus = "open"): EventItem => ({
  id: "1",
  organizerId: "2",
  title: "Conference",
  description: "desc",
  venue: "Hall",
  eventDate: "2026-07-20T08:00:00",
  capacity: 20,
  status,
  cover_image_path: "cover.jpg",
});

const renderForEvent = () =>
  render(
    <MemoryRouter initialEntries={["/organizer/events/1"]}>
      <Routes>
        <Route path="/organizer/events/:id" element={<RegistrantList />} />
      </Routes>
    </MemoryRouter>,
  );

describe("RegistrantList UI", () => {
  beforeEach(() => {
    store.eventById.mockReset();
    store.recordAttendance.mockReset();
    registrationsApi.eventRegistrations.mockReset();

    store.eventById.mockReturnValue(eventItem());
  });

  it("displays registrants for the selected event", async () => {
    registrationsApi.eventRegistrations.mockResolvedValue({
      data: [
        registration({ id: 1, user: userFixture(10, "Alice", "alice@tipon.test" ) }),
        registration({ id: 2, user: userFixture(11, "Bob", "bob@tipon.test" ) }),
      ],
    });

    renderForEvent();

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@tipon.test")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("excludes cancelled registrations", async () => {
    registrationsApi.eventRegistrations.mockResolvedValue({
      data: [
        registration({ id: 1, user: userFixture(10, "Alice", "alice@tipon.test"), status: "registered" }),
        registration({ id: 2, user: userFixture(11, "Bob", "bob@tipon.test"), status: "cancelled" }),
      ],
    });

    renderForEvent();

    expect(await screen.findByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("marks participant as present", async () => {
    const user = userEvent.setup();
    registrationsApi.eventRegistrations.mockResolvedValue({
      data: [
        registration({ id: 1, user: userFixture(10, "Alice", "alice@tipon.test" ) }),
      ],
    });

    renderForEvent();
    const row = await screen.findByRole("row", { name: /Alice/ });

    await user.click(within(row).getByRole("button", { name: /Present/ }));
    expect(store.recordAttendance).toHaveBeenCalledWith("1", "present");
    expect(within(row).getAllByText("Present")).toHaveLength(2);
  });

  it("marks participant as absent", async () => {
    const user = userEvent.setup();
    registrationsApi.eventRegistrations.mockResolvedValue({
      data: [
        registration({ id: 1, user: userFixture(10, "Alice", "alice@tipon.test" ), attendance: "pending" }),
      ],
    });

    renderForEvent();
    const row = await screen.findByRole("row", { name: /Alice/ });

    await user.click(within(row).getByRole("button", { name: /Absent/ }));
    expect(store.recordAttendance).toHaveBeenCalledWith("1", "absent");
    expect(within(row).getAllByText("Absent")).toHaveLength(2);
  });

  it("shows empty state when there are no registrants", async () => {
    registrationsApi.eventRegistrations.mockResolvedValue({ data: [] });
    renderForEvent();

    expect(await screen.findByText(/No registrants found/)).toBeInTheDocument();
  });
});
