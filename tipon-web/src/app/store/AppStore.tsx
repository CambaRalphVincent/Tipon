// Central in-memory store for the Event Registration System prototype.
// Holds users, events, registrations and notifications, exposes actions, and
// enforces capacity / duplicate-registration rules (FR-14..FR-17).

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  users as seedUsers,
  events as seedEvents,
  registrations as seedRegistrations,
  notifications as seedNotifications,
  DEFAULT_PARTICIPANT_ID,
  DEFAULT_ORGANIZER_ID,
  type AppNotification,
  type EventItem,
  type Registration,
  type User,
  type UserRole,
} from "../data/mockData";

interface NewEventInput {
  title: string;
  description: string;
  venue: string;
  eventDate: string;
  capacity: number;
  cover_image_path?: string;
}

interface LoginResult {
  ok: boolean;
  role?: UserRole;
}

interface AppStoreValue {
  // identity
  currentUser: User;
  role: UserRole;
  /** Mock backend auth: resolves the user's role from their email. */
  login: (email: string, password: string) => LoginResult;
  /** Participant self-registration. */
  registerParticipant: (name: string, email: string) => LoginResult;

  // data
  users: User[];
  events: EventItem[];
  registrations: Registration[];
  notifications: AppNotification[];

  // derived helpers
  confirmedCountFor: (eventId: string) => number;
  remainingFor: (eventId: string) => number;
  isFull: (eventId: string) => boolean;
  registrationFor: (eventId: string, userId?: string) => Registration | undefined;
  userById: (id: string) => User | undefined;
  eventById: (id: string) => EventItem | undefined;

  // participant actions
  register: (eventId: string) => void;
  cancelRegistration: (eventId: string) => void;

  // organizer actions
  createEvent: (input: NewEventInput) => void;
  updateEvent: (eventId: string, input: NewEventInput) => void;
  cancelEvent: (eventId: string) => void;
  recordAttendance: (registrationId: string, attendance: Registration["attendance"]) => void;

  // notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

// Safe read-only default used when a component renders outside the provider
// (e.g. Figma's isolated component preview). All mutating actions are no-ops.
const defaultUser = seedUsers.find((u) => u.id === DEFAULT_ORGANIZER_ID)!;
const noop = () => {};
const defaultContextValue: AppStoreValue = {
  currentUser: defaultUser,
  role: "organizer",
  login: () => ({ ok: true, role: "organizer" }),
  registerParticipant: () => ({ ok: true, role: "participant" }),
  users: seedUsers,
  events: seedEvents,
  registrations: seedRegistrations,
  notifications: seedNotifications,
  confirmedCountFor: (id) => seedRegistrations.filter((r) => r.eventId === id && r.status === "registered").length,
  remainingFor: (id) => {
    const ev = seedEvents.find((e) => e.id === id);
    if (!ev) return 0;
    const filled = seedRegistrations.filter((r) => r.eventId === id && r.status === "registered").length;
    return Math.max(0, ev.capacity - filled);
  },
  isFull: (id) => {
    const ev = seedEvents.find((e) => e.id === id);
    if (!ev) return false;
    const filled = seedRegistrations.filter((r) => r.eventId === id && r.status === "registered").length;
    return filled >= ev.capacity;
  },
  registrationFor: (eventId, userId = defaultUser.id) =>
    seedRegistrations.find((r) => r.eventId === eventId && r.userId === userId && r.status === "registered"),
  userById: (id) => seedUsers.find((u) => u.id === id),
  eventById: (id) => seedEvents.find((e) => e.id === id),
  register: noop,
  cancelRegistration: noop,
  createEvent: noop,
  updateEvent: noop,
  cancelEvent: noop,
  recordAttendance: noop,
  markNotificationRead: noop,
  markAllNotificationsRead: noop,
};

const AppStoreContext = createContext<AppStoreValue>(defaultContextValue);

let idCounter = 1000;
const nextId = (prefix: string) => `${prefix}-${++idCounter}`;

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [users] = useState<User[]>(seedUsers);
  const [currentUserId, setCurrentUserId] = useState<string>(DEFAULT_PARTICIPANT_ID);
  const [events, setEvents] = useState<EventItem[]>(seedEvents);
  const [registrations, setRegistrations] = useState<Registration[]>(seedRegistrations);
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? users[0],
    [currentUserId, users],
  );
  // Role is derived from the signed-in account — never chosen at login.
  const role: UserRole = currentUser.role;

  // Mock backend: match the email against seeded accounts to determine the role.
  // Any organizer email signs in as an organizer; everything else is a
  // participant (prototype — the password is not actually verified).
  const login = (email: string): LoginResult => {
    const match = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (match) {
      setCurrentUserId(match.id);
      return { ok: true, role: match.role };
    }
    // Unknown email — default to organizer for testing purposes.
    setCurrentUserId(DEFAULT_ORGANIZER_ID);
    return { ok: true, role: "organizer" };
  };

  const registerParticipant = (): LoginResult => {
    setCurrentUserId(DEFAULT_PARTICIPANT_ID);
    return { ok: true, role: "participant" };
  };

  const userById = (id: string) => users.find((u) => u.id === id);
  const eventById = (id: string) => events.find((e) => e.id === id);

  const confirmedCountFor = (eventId: string) =>
    registrations.filter((r) => r.eventId === eventId && r.status === "registered").length;

  const remainingFor = (eventId: string) => {
    const ev = eventById(eventId);
    if (!ev) return 0;
    return Math.max(0, ev.capacity - confirmedCountFor(eventId));
  };

  const isFull = (eventId: string) => remainingFor(eventId) <= 0;

  const registrationFor = (eventId: string, userId = currentUser.id) =>
    registrations.find(
      (r) => r.eventId === eventId && r.userId === userId && r.status === "registered",
    );

  const pushNotification = (n: Omit<AppNotification, "id" | "createdAt" | "readAt">) => {
    setNotifications((prev) => [
      { ...n, id: nextId("nt"), readAt: null, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  // -- Participant actions ---------------------------------------------------

  const register = (eventId: string) => {
    const ev = eventById(eventId);
    if (!ev) return;

    if (ev.status === "cancelled") {
      toast.error("This event has been cancelled.");
      return;
    }
    // FR-16 — prevent duplicate registration.
    if (registrationFor(eventId)) {
      toast.error("You're already registered for this event.");
      return;
    }
    // FR-15 / FR-17 — enforce capacity.
    if (isFull(eventId)) {
      toast.error("Registration is closed — this event is at full capacity.");
      return;
    }

    setRegistrations((prev) => [
      ...prev,
      {
        id: nextId("rg"),
        eventId,
        userId: currentUser.id,
        status: "registered",
        attendance: "pending",
        createdAt: new Date().toISOString(),
      },
    ]);
    // FR-22 — notify on successful registration.
    pushNotification({
      type: "registration_confirmed",
      userId: currentUser.id,
      title: "Registration confirmed",
      body: `You're registered for "${ev.title}".`,
    });
    toast.success(`Registered for "${ev.title}"`);
  };

  const cancelRegistration = (eventId: string) => {
    const reg = registrationFor(eventId);
    if (!reg) return;
    setRegistrations((prev) =>
      prev.map((r) => (r.id === reg.id ? { ...r, status: "cancelled" } : r)),
    );
    const ev = eventById(eventId);
    toast.success(`Cancelled registration${ev ? ` for "${ev.title}"` : ""}`);
  };

  // -- Organizer actions -----------------------------------------------------

  const createEvent = (input: NewEventInput) => {
    const ev: EventItem = {
      id: nextId("ev"),
      organizerId: currentUser.id,
      title: input.title,
      description: input.description,
      venue: input.venue,
      eventDate: input.eventDate,
      capacity: input.capacity,
      status: "open",
      cover_image_path: input.cover_image_path ||
        "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1200&q=80",
    };
    setEvents((prev) => [ev, ...prev]);
    toast.success(`Event "${ev.title}" created`);
  };

  const updateEvent = (eventId: string, input: NewEventInput) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, ...input } : e)),
    );
    // FR-23 — notify registered participants of updates.
    const regs = registrations.filter((r) => r.eventId === eventId && r.status === "registered");
    regs.forEach((r) =>
      pushNotification({
        type: "event_updated",
        userId: r.userId,
        title: "Event details updated",
        body: `"${input.title}" has been updated by the organizer.`,
      }),
    );
    toast.success("Event updated");
  };

  const cancelEvent = (eventId: string) => {
    const ev = eventById(eventId);
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, status: "cancelled" } : e)),
    );
    const regs = registrations.filter((r) => r.eventId === eventId && r.status === "registered");
    regs.forEach((r) =>
      pushNotification({
        type: "event_cancelled",
        userId: r.userId,
        title: "Event cancelled",
        body: `"${ev?.title ?? "An event"}" you registered for has been cancelled.`,
      }),
    );
    toast.success("Event cancelled");
  };

  const recordAttendance = (
    registrationId: string,
    attendance: Registration["attendance"],
  ) => {
    setRegistrations((prev) =>
      prev.map((r) => (r.id === registrationId ? { ...r, attendance } : r)),
    );
  };

  // -- Notifications ---------------------------------------------------------

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() })),
    );
  };

  const value: AppStoreValue = {
    currentUser,
    role,
    login,
    registerParticipant,
    users,
    events,
    registrations,
    notifications,
    confirmedCountFor,
    remainingFor,
    isFull,
    registrationFor,
    userById,
    eventById,
    register,
    cancelRegistration,
    createEvent,
    updateEvent,
    cancelEvent,
    recordAttendance,
    markNotificationRead,
    markAllNotificationsRead,
  };

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  return useContext(AppStoreContext);
}
