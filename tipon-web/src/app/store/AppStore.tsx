import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  authApi,
  eventsApi,
  notificationsApi,
  registrationsApi,
  type ApiEvent,
  type ApiNotification,
  type ApiRegistration,
  type ApiUser,
} from "../lib/api";
import type {
  AppNotification,
  AttendanceStatus,
  EventItem,
  NotificationType,
  Registration,
  User,
  UserRole,
} from "../data/mockData";

// ---------------------------------------------------------------------------
// Adapters — convert snake_case API responses to camelCase frontend types
// ---------------------------------------------------------------------------

function adaptUser(u: ApiUser | { id: number; name: string; email: string; role?: string }): User {
  return {
    id: String(u.id),
    name: u.name,
    email: u.email,
    role: ((u.role ?? "participant") as UserRole),
  };
}

function isApiEvent(e: unknown): e is ApiEvent {
  if (!e || typeof e !== "object") return false;
  const event = e as Partial<ApiEvent>;
  return (
    typeof event.id === "number" &&
    typeof event.organizer_id === "number" &&
    typeof event.title === "string" &&
    typeof event.venue === "string" &&
    typeof event.event_date === "string" &&
    typeof event.capacity === "number"
  );
}

function adaptEvent(e: ApiEvent): EventItem {
  return {
    id: String(e.id),
    organizerId: String(e.organizer_id),
    title: e.title,
    description: e.description ?? "",
    venue: e.venue,
    eventDate: e.event_date,
    capacity: e.capacity,
    status: e.status ?? "open",
    cover_image_path: e.cover_image_path ?? "",
    registeredCount: e.registered_count ?? 0,
  };
}

export function adaptRegistration(r: ApiRegistration): Registration {
  return {
    id: String(r.id),
    eventId: String(r.event_id),
    userId: String(r.user_id),
    status: r.status,
    attendance: r.attendance,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function notificationActionUrl(n: ApiNotification): string | undefined {
  const actionUrl = n.data?.action_url;
  const kind = n.data?.kind;
  const eventId = n.data?.event_id;

  if (
    eventId &&
    (kind === "admin_event_created" || kind === "admin_event_cancellation_summary") &&
    (!actionUrl || actionUrl === "/admin/events")
  ) {
    return `/admin/events?event=${eventId}`;
  }

  return actionUrl;
}

function adaptNotification(n: ApiNotification): AppNotification {
  const status = n.data?.status;
  const isOrganizerNotification = n.data?.audience === "organizer";
  const type: NotificationType = n.data?.kind
    ?? (isOrganizerNotification
      ? (status === "registered" ? "participant_registered" : "participant_cancelled")
      : (status === "registered" ? "registration_confirmed" : "event_cancelled"));
  const title = n.data?.title
    ?? (isOrganizerNotification
      ? (status === "registered" ? "New registration" : "Registration cancelled")
      : (status === "registered" ? "Registration confirmed" : "Registration cancelled"));

  return {
    id: n.id,
    type,
    userId: String(n.notifiable_id),
    title,
    body: n.data?.message ?? "",
    createdAt: n.created_at,
    readAt: n.read_at,
    actionUrl: notificationActionUrl(n),
  };
}

// ---------------------------------------------------------------------------
// Store interface
// ---------------------------------------------------------------------------

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
  requiresVerification?: boolean;
  email?: string;
}

interface AppStoreValue {
  initialized: boolean;
  currentUser: User | null;
  role: UserRole;
  login: (email: string, password: string) => Promise<LoginResult>;
  registerParticipant: (name: string, email: string, password: string) => Promise<LoginResult>;
  verifyEmailOtp: (email: string, code: string) => Promise<LoginResult>;
  resendVerificationCode: (email: string) => Promise<boolean>;
  logout: () => Promise<void>;

  users: User[];
  events: EventItem[];
  registrations: Registration[];
  notifications: AppNotification[];

  confirmedCountFor: (eventId: string) => number;
  remainingFor: (eventId: string) => number;
  isFull: (eventId: string) => boolean;
  registrationFor: (eventId: string) => Registration | undefined;
  userById: (id: string) => User | undefined;
  eventById: (id: string) => EventItem | undefined;

  register: (eventId: string) => void;
  cancelRegistration: (eventId: string) => void;
  createEvent: (input: NewEventInput) => void;
  updateEvent: (eventId: string, input: NewEventInput) => void;
  cancelEvent: (eventId: string) => void;
  recordAttendance: (registrationId: string, attendance: AttendanceStatus) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const noop = () => {};

const defaultContextValue: AppStoreValue = {
  initialized: false,
  currentUser: null,
  role: "participant",
  login: async () => ({ ok: false }),
  registerParticipant: async () => ({ ok: false }),
  verifyEmailOtp: async () => ({ ok: false }),
  resendVerificationCode: async () => false,
  logout: async () => {},
  users: [],
  events: [],
  registrations: [],
  notifications: [],
  confirmedCountFor: () => 0,
  remainingFor: () => 0,
  isFull: () => false,
  registrationFor: () => undefined,
  userById: () => undefined,
  eventById: () => undefined,
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

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const role: UserRole = currentUser?.role ?? "participant";

  const mergeUsers = (incoming: User[]) => {
    setUsers((prev) => {
      const map = new Map(prev.map((u) => [u.id, u]));
      incoming.forEach((u) => { if (!map.has(u.id)) map.set(u.id, u); });
      return Array.from(map.values());
    });
  };

  const loadAppData = async (user: User) => {
    const [eventsRes, notifRes] = await Promise.all([
      eventsApi.all(),
      notificationsApi.all(),
    ]);

    setEvents(eventsRes.data.map(adaptEvent));
    setNotifications(notifRes.data.map(adaptNotification));

    // Collect organizer info from event list into users map
    const organizerUsers = eventsRes.data
      .filter((e) => e.organizer)
      .map((e) => ({ id: String(e.organizer!.id), name: e.organizer!.name, email: "", role: "organizer" as UserRole }));
    mergeUsers(organizerUsers);

    if (user.role === "participant") {
      const regsRes = await registrationsApi.myRegistrations();
      setRegistrations(regsRes.data.map(adaptRegistration));
    } else if (user.role === "organizer") {
      const regsRes = await registrationsApi.organizerRegistrations();
      setRegistrations(regsRes.data.map(adaptRegistration));
      const participantUsers = regsRes.data
        .filter((r) => r.user)
        .map((r) => ({ id: String(r.user!.id), name: r.user!.name, email: r.user!.email, role: "participant" as UserRole }));
      mergeUsers(participantUsers);
    }
  };

  // Auto-login on mount by asking the API who the session cookie belongs to.
  // No client-side token check needed — the browser sends the session cookie
  // automatically, and a 401 here just means "not logged in."
  useEffect(() => {
    authApi.me()
      .then(async (res) => {
        const user = adaptUser(res.data);
        setCurrentUser(user);
        mergeUsers([user]);
        await loadAppData(user);
      })
      .catch(() => {})
      .finally(() => setInitialized(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------------

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const res = await authApi.login({ email, password });
      const user = adaptUser(res.data.user);
      setCurrentUser(user);
      mergeUsers([user]);
      await loadAppData(user);
      return { ok: true, role: user.role };
    } catch (err: unknown) {
      const errData = (
        err as { response?: { status?: number; data?: { message?: string; requires_verification?: boolean; email?: string } } }
      )?.response;
      if (errData?.status === 403 && errData.data?.requires_verification) {
        return { ok: false, requiresVerification: true, email: errData.data.email ?? email };
      }
      toast.error(errData?.data?.message ?? "Invalid credentials.");
      return { ok: false };
    }
  };

  const registerParticipant = async (
    name: string,
    email: string,
    password: string,
  ): Promise<LoginResult> => {
    try {
      const res = await authApi.register({ name, email, password, password_confirmation: password });
      return { ok: true, requiresVerification: true, email: res.data.email };
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })
        ?.response?.data;
      const msg = errData?.errors
        ? Object.values(errData.errors).flat()[0]
        : (errData?.message ?? "Registration failed.");
      toast.error(msg);
      return { ok: false };
    }
  };

  const verifyEmailOtp = async (email: string, code: string): Promise<LoginResult> => {
    try {
      const res = await authApi.verifyOtp({ email, code });
      const user = adaptUser(res.data.user);
      setCurrentUser(user);
      mergeUsers([user]);
      await loadAppData(user);
      return { ok: true, role: user.role };
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Invalid or expired code.";
      toast.error(msg);
      return { ok: false };
    }
  };

  const resendVerificationCode = async (email: string): Promise<boolean> => {
    try {
      await authApi.resendOtp({ email });
      toast.success("Verification code resent.");
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Failed to resend code.";
      toast.error(msg);
      return false;
    }
  };

  const logout = async () => {
    try { await authApi.logout(); } catch { /* proceed even if API fails */ }
    setCurrentUser(null);
    setUsers([]);
    setEvents([]);
    setRegistrations([]);
    setNotifications([]);
  };

  // ---------------------------------------------------------------------------
  // Derived helpers
  // ---------------------------------------------------------------------------

  const userById = (id: string) => users.find((u) => u.id === id);
  const eventById = (id: string) => events.find((e) => e.id === id);

  const confirmedCountFor = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (ev?.registeredCount !== undefined) return ev.registeredCount;
    return registrations.filter((r) => r.eventId === eventId && r.status === "registered").length;
  };

  const remainingFor = (eventId: string) => {
    const ev = eventById(eventId);
    if (!ev) return 0;
    return Math.max(0, ev.capacity - confirmedCountFor(eventId));
  };

  const isFull = (eventId: string) => remainingFor(eventId) <= 0;

  const registrationFor = (eventId: string) =>
    registrations.find(
      (r) => r.eventId === eventId && r.userId === (currentUser?.id ?? "") && r.status === "registered",
    );

  // ---------------------------------------------------------------------------
  // Participant actions
  // ---------------------------------------------------------------------------

  const register = (eventId: string) => {
    void (async () => {
      try {
        const res = await registrationsApi.register(eventId);
        const registration = adaptRegistration(res.data);
        setRegistrations((prev) => [
          ...prev.filter(
            (r) =>
              !(
                r.eventId === registration.eventId &&
                r.userId === registration.userId &&
                r.status === "cancelled"
              ),
          ),
          registration,
        ]);
        setEvents((prev) =>
          prev.map((e) => e.id === eventId ? { ...e, registeredCount: (e.registeredCount ?? 0) + 1 } : e),
        );
        toast.success(`Registered for "${eventById(eventId)?.title ?? "the event"}"`);
        const notifRes = await notificationsApi.all();
        setNotifications(notifRes.data.map(adaptNotification));
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Registration failed.";
        toast.error(msg);
      }
    })();
  };

  const cancelRegistration = (eventId: string) => {
    const reg = registrationFor(eventId);
    if (!reg) return;
    void (async () => {
      try {
        await registrationsApi.cancel(reg.id);
        const cancelledAt = new Date().toISOString();
        setRegistrations((prev) =>
          prev
            .filter(
              (r) =>
                !(
                  r.eventId === eventId &&
                  r.userId === reg.userId &&
                  r.status === "cancelled"
                ),
            )
            .map((r) => (r.id === reg.id ? { ...r, status: "cancelled", updatedAt: cancelledAt } : r)),
        );
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId ? { ...e, registeredCount: Math.max(0, (e.registeredCount ?? 1) - 1) } : e,
          ),
        );
        toast.success(`Cancelled registration for "${eventById(eventId)?.title ?? "the event"}"`);
        const notifRes = await notificationsApi.all();
        setNotifications(notifRes.data.map(adaptNotification));
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Cancellation failed.";
        toast.error(msg);
      }
    })();
  };

  // ---------------------------------------------------------------------------
  // Organizer actions
  // ---------------------------------------------------------------------------

  const createEvent = (input: NewEventInput) => {
    void (async () => {
      try {
        const res = await eventsApi.create({
        title: input.title,
        description: input.description,
        venue: input.venue,
          event_date: input.eventDate,
          capacity: input.capacity,
          cover_image_path: input.cover_image_path?.startsWith("blob:") ? undefined : input.cover_image_path,
        });
        if (!isApiEvent(res.data)) {
          const eventsRes = await eventsApi.all();
          setEvents(eventsRes.data.filter(isApiEvent).map(adaptEvent));
          toast.success("Event created");
          return;
        }
        const adapted = { ...adaptEvent(res.data), registeredCount: 0 };
        setEvents((prev) => [adapted, ...prev]);
        toast.success(`Event "${adapted.title}" created`);
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to create event.";
        toast.error(msg);
      }
    })();
  };

  const updateEvent = (eventId: string, input: NewEventInput) => {
    void (async () => {
      try {
        const res = await eventsApi.update(eventId, {
          title: input.title,
          description: input.description,
          venue: input.venue,
          event_date: input.eventDate,
          capacity: input.capacity,
          cover_image_path: input.cover_image_path?.startsWith("blob:") ? undefined : input.cover_image_path,
        });
        if (!isApiEvent(res.data)) {
          const eventsRes = await eventsApi.all();
          setEvents(eventsRes.data.filter(isApiEvent).map(adaptEvent));
          toast.success("Event updated");
          return;
        }
        const adapted = adaptEvent(res.data);
        setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ...adapted } : e)));
        toast.success("Event updated");
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to update event.";
        toast.error(msg);
      }
    })();
  };

  const cancelEvent = (eventId: string) => {
    void (async () => {
      try {
        await eventsApi.cancel(eventId);
        setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, status: "cancelled" } : e)));
        toast.success("Event cancelled");
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to cancel event.";
        toast.error(msg);
      }
    })();
  };

  const recordAttendance = (registrationId: string, attendance: AttendanceStatus) => {
    void (async () => {
      try {
        await registrationsApi.markAttendance(registrationId, attendance);
        setRegistrations((prev) =>
          prev.map((r) => (r.id === registrationId ? { ...r, attendance } : r)),
        );
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Failed to record attendance.";
        toast.error(msg);
      }
    })();
  };

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------

  const markNotificationRead = (id: string) => {
    void (async () => {
      try {
        await notificationsApi.markRead(id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
        );
      } catch { /* silently ignore */ }
    })();
  };

  const markAllNotificationsRead = () => {
    const unread = notifications.filter((n) => !n.readAt);
    if (unread.length === 0) return;
    void (async () => {
      try {
        await Promise.all(unread.map((n) => notificationsApi.markRead(n.id)));
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })),
        );
      } catch { /* silently ignore */ }
    })();
  };

  // ---------------------------------------------------------------------------

  const value: AppStoreValue = {
    initialized,
    currentUser,
    role,
    login,
    registerParticipant,
    verifyEmailOtp,
    resendVerificationCode,
    logout,
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
