import { render, screen, waitFor } from "@testing-library/react";
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

vi.mock("../../lib/api", () => ({
  authApi,
  eventsApi,
  registrationsApi,
  notificationsApi,
}));

const apiUser = (role: "participant" | "organizer" | "admin"): ApiUser => ({
  id: 101,
  name: role === "organizer" ? "Organizer One" : "Participant One",
  email: `${role}@tipon.test`,
  role,
  email_verified_at: null,
  created_at: "2026-01-01T08:00:00.000Z",
  updated_at: "2026-01-01T08:00:00.000Z",
});

const makeEvent = (overrides: Partial<ApiEvent>): ApiEvent => ({
  id: 1,
  organizer_id: 201,
  title: "Sample",
  description: "Description",
  venue: "Venue",
  event_date: "2026-07-20T08:00:00",
  capacity: 10,
  status: "open",
  cover_image_path: "cover.jpg",
  registered_count: 1,
  organizer: { id: 201, name: "Organizer One" },
  created_at: "2026-01-01T08:00:00.000Z",
  updated_at: "2026-01-01T08:00:00.000Z",
  ...overrides,
});

const EventStoreHarness = () => {
  const store = useAppStore();
  return (
    <div>
      <pre data-testid="initialized">{String(store.initialized)}</pre>
      <pre data-testid="user">{JSON.stringify(store.currentUser)}</pre>
      <pre data-testid="events">{JSON.stringify(store.events)}</pre>
      <pre data-testid="registrations">{JSON.stringify(store.registrations)}</pre>
      <pre data-testid="notifications">{JSON.stringify(store.notifications)}</pre>
      <button
        type="button"
        onClick={() =>
          store.createEvent({
            title: "Created",
            description: "Created desc",
            venue: "New venue",
            eventDate: "2026-07-30T10:00:00",
            capacity: 15,
            cover_image_path: "new.jpg",
          })
        }
      >
        create-event
      </button>
      <button
        type="button"
        onClick={() =>
          store.updateEvent("1", {
            title: "Updated",
            description: "Updated desc",
            venue: "Updated venue",
            eventDate: "2026-07-21T10:00:00",
            capacity: 12,
            cover_image_path: "updated.jpg",
          })
        }
      >
        update-event
      </button>
      <button type="button" onClick={() => store.cancelEvent("1")}>
        cancel-event
      </button>
      <button type="button" onClick={() => store.logout()}>
        logout
      </button>
    </div>
  );
};

const bootstrap = async () => {
  authApi.me.mockResolvedValue({ data: apiUser("organizer") });
  eventsApi.all.mockResolvedValue({ data: [makeEvent({ title: "Original", id: 1 })] });
  notificationsApi.all.mockResolvedValue({
    data: [
      {
        id: "n1",
        type: "organizer_registration",
        notifiable_type: "App\\\\User",
        notifiable_id: 101,
        data: {
          event_id: 1,
          event_title: "Original",
          status: "registered",
          audience: "organizer",
          kind: "participant_registered",
          action_url: "/organizer/events/1",
          participant_id: 301,
          participant_name: "Participant One",
          message: "Participant One registered for Original.",
        },
        read_at: null,
        created_at: "2026-01-01T08:00:00.000Z",
        updated_at: "2026-01-01T08:00:00.000Z",
      },
    ],
  });
  registrationsApi.myRegistrations.mockResolvedValue({ data: [] });
  registrationsApi.organizerRegistrations.mockResolvedValue({ data: [] as ApiRegistration[] });

  render(
    <AppStoreProvider>
      <EventStoreHarness />
    </AppStoreProvider>,
  );

  await waitFor(() => expect(screen.getByTestId("initialized")).toHaveTextContent("true"));
};

const parseState = (id: string) =>
  JSON.parse(screen.getByTestId(id).textContent ?? "[]") as Array<Record<string, unknown>>;

describe("AppStore event behavior", () => {
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
  });

  it("adds a new event to local state when created", async () => {
    eventsApi.create.mockResolvedValue({ data: makeEvent({ id: 2, title: "Created", description: "Created desc" }) });
    await bootstrap();

    expect(parseState("events")[0].title).toBe("Original");

    screen.getByRole("button", { name: "create-event" }).click();

    await waitFor(() => expect(parseState("events")[0].title).toBe("Created"));
  });

  it("replaces event data when updateEvent is called", async () => {
    eventsApi.update.mockResolvedValue({
      data: makeEvent({ id: 1, title: "Updated", description: "Updated desc", venue: "Updated venue" }),
    });
    await bootstrap();

    screen.getByRole("button", { name: "update-event" }).click();

    await waitFor(() => expect(parseState("events")[0].title).toBe("Updated"));
  });

  it("sets status to cancelled after cancelEvent", async () => {
    eventsApi.cancel.mockResolvedValue({});
    await bootstrap();

    expect(parseState("events")[0].status).toBe("open");
    screen.getByRole("button", { name: "cancel-event" }).click();

    await waitFor(() => expect(parseState("events")[0].status).toBe("cancelled"));
  });

  it("adapts organizer registration notifications for the bell", async () => {
    await bootstrap();

    const notifications = parseState("notifications");

    expect(notifications[0].type).toBe("participant_registered");
    expect(notifications[0].title).toBe("New registration");
    expect(notifications[0].body).toBe("Participant One registered for Original.");
    expect(notifications[0].userId).toBe("101");
    expect(notifications[0].actionUrl).toBe("/organizer/events/1");
  });

  it("clears user, events, registrations, and notifications on logout", async () => {
    await bootstrap();

    screen.getByRole("button", { name: "logout" }).click();

    await waitFor(() => expect(screen.getByTestId("user")).toHaveTextContent("null"));
    await waitFor(() => expect(screen.getByTestId("events")).toHaveTextContent("[]"));
    await waitFor(() => expect(screen.getByTestId("registrations")).toHaveTextContent("[]"));
    await waitFor(() => expect(screen.getByTestId("notifications")).toHaveTextContent("[]"));
  });
});
