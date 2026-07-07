import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppStoreProvider, useAppStore } from "../../store/AppStore";
import type { ApiEvent, ApiRegistration, ApiUser } from "../../lib/api";

const authApi = vi.hoisted(() => ({
  me: vi.fn(),
  logout: vi.fn(),
}));
const eventsApi = vi.hoisted(() => ({
  all: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  cancel: vi.fn(),
}));
const registrationsApi = vi.hoisted(() => ({
  myRegistrations: vi.fn(),
  organizerRegistrations: vi.fn(),
  eventRegistrations: vi.fn(),
  register: vi.fn(),
  cancel: vi.fn(),
  markAttendance: vi.fn(),
}));
const notificationsApi = vi.hoisted(() => ({
  all: vi.fn(),
  markRead: vi.fn(),
}));
const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  authApi,
  eventsApi,
  registrationsApi,
  notificationsApi,
}));
vi.mock("sonner", () => ({ toast }));

const user: ApiUser = {
  id: 101,
  name: "Participant One",
  email: "p@tipon.test",
  role: "participant",
  email_verified_at: null,
  created_at: "2026-01-01T08:00:00.000Z",
  updated_at: "2026-01-01T08:00:00.000Z",
};

const baseEvent: ApiEvent = {
  id: 1,
  organizer_id: 201,
  title: "Sample Event",
  description: "Sample",
  venue: "Room",
  event_date: "2026-07-20T08:00:00",
  capacity: 10,
  status: "open",
  cover_image_path: "cover.jpg",
  registered_count: 2,
  organizer: { id: 201, name: "Organizer One" },
  created_at: "2026-01-01T08:00:00.000Z",
  updated_at: "2026-01-01T08:00:00.000Z",
};

const registration = (overrides: Partial<ApiRegistration>): ApiRegistration => ({
  id: 900,
  event_id: 1,
  user_id: 101,
  status: "registered",
  attendance: "pending",
  created_at: "2026-07-01T08:00:00.000Z",
  updated_at: "2026-07-01T08:00:00.000Z",
  event: baseEvent,
  ...overrides,
});

const AppStoreHarness = () => {
  const store = useAppStore();
  return (
    <div>
      <span data-testid="initialized">{String(store.initialized)}</span>
      <pre data-testid="user">{JSON.stringify(store.currentUser)}</pre>
      <pre data-testid="events">{JSON.stringify(store.events)}</pre>
      <pre data-testid="registrations">{JSON.stringify(store.registrations)}</pre>
      <button type="button" onClick={() => store.register("1")} data-testid="register">
        register
      </button>
      <button type="button" onClick={() => store.cancelRegistration("1")} data-testid="cancel">
        cancel
      </button>
    </div>
  );
};

const loadStore = async (initialRegs: ApiRegistration[]) => {
  authApi.me.mockResolvedValue({ data: user });
  eventsApi.all.mockResolvedValue({ data: [baseEvent] });
  notificationsApi.all.mockResolvedValue({ data: [] });
  registrationsApi.myRegistrations.mockResolvedValue({ data: initialRegs });
  registrationsApi.organizerRegistrations.mockResolvedValue({ data: [] });

  render(
    <AppStoreProvider>
      <AppStoreHarness />
    </AppStoreProvider>,
  );

  await waitFor(() => expect(screen.getByTestId("initialized")).toHaveTextContent("true"));
};

const parseState = (id: string) =>
  JSON.parse(screen.getByTestId(id).textContent ?? "[]") as Array<Record<string, unknown>>;

describe("AppStore registration behavior", () => {
  beforeEach(() => {
    authApi.me.mockReset();
    authApi.logout.mockReset();
    eventsApi.all.mockReset();
    eventsApi.create.mockReset();
    eventsApi.update.mockReset();
    eventsApi.cancel.mockReset();
    registrationsApi.myRegistrations.mockReset();
    registrationsApi.organizerRegistrations.mockReset();
    registrationsApi.eventRegistrations.mockReset();
    registrationsApi.register.mockReset();
    registrationsApi.cancel.mockReset();
    registrationsApi.markAttendance.mockReset();
    notificationsApi.all.mockReset();
    notificationsApi.markRead.mockReset();
    toast.error.mockReset();
    toast.success.mockReset();
  });

  it("removes old cancelled registration history when registering", async () => {
    const userActions = userEvent.setup();
    const cancelled = registration({ id: 1, status: "cancelled" });

    registrationsApi.register.mockResolvedValue({
      data: registration({
        id: 3,
        status: "registered",
        event_id: 1,
        user_id: 101,
      }) as ApiRegistration,
    });
    await loadStore([cancelled]);

    expect(parseState("registrations")).toHaveLength(1);
    await userActions.click(screen.getByTestId("register"));
    await waitFor(() => expect(parseState("registrations")).toHaveLength(1));

    const rows = parseState("registrations");
    expect(rows[0].id).toBe("3");
    expect(rows[0].status).toBe("registered");
    const events = parseState("events");
    expect(events[0].registeredCount).toBe(3);
  });

  it("does not duplicate cancelled registrations when cancelling", async () => {
    const userActions = userEvent.setup();
    const active = registration({ id: 10, status: "registered" });
    const oldCancelled = registration({ id: 11, status: "cancelled" });

    registrationsApi.cancel.mockResolvedValue({ data: active });
    await loadStore([active, oldCancelled]);

    expect(parseState("registrations")).toHaveLength(2);
    await userActions.click(screen.getByTestId("cancel"));
    await waitFor(() => expect(parseState("registrations")).toHaveLength(1));

    const rows = parseState("registrations");
    expect(rows[0].id).toBe("10");
    expect(rows[0].status).toBe("cancelled");
  });

  it("reduces event registered count when cancelling", async () => {
    const userActions = userEvent.setup();
    const active = registration({ id: 20 });

    registrationsApi.cancel.mockResolvedValue({ data: active });
    await loadStore([active]);

    const eventsBefore = parseState("events");
    expect(eventsBefore[0].registeredCount).toBe(2);

    await userActions.click(screen.getByTestId("cancel"));
    await waitFor(() => {
      const eventsAfter = parseState("events");
      expect(eventsAfter[0].registeredCount).toBe(1);
    });
  });

  it("shows an error toast when registration fails", async () => {
    const userActions = userEvent.setup();
    registrationsApi.register.mockRejectedValue({
      response: { data: { message: "Registration failed." } },
    });
    await loadStore([registration({ id: 30 })]);

    await userActions.click(screen.getByTestId("register"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Registration failed."),
    );
  });
});
