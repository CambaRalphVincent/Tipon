import axios from "axios";
import type { AttendanceStatus, EventStatus, RegistrationStatus, UserRole } from "../data/mockData";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:8000/api",
  headers: { Accept: "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---------------------------------------------------------------------------
// Raw API types (what Laravel returns)
// ---------------------------------------------------------------------------

export interface ApiUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiEvent {
  id: number;
  organizer_id: number;
  title: string;
  description: string | null;
  venue: string;
  event_date: string;
  capacity: number;
  status: EventStatus;
  cover_image_path: string | null;
  registered_count?: number;
  organizer?: { id: number; name: string };
  created_at: string;
  updated_at: string;
}

export interface ApiRegistration {
  id: number;
  event_id: number;
  user_id: number;
  status: RegistrationStatus;
  attendance: AttendanceStatus;
  created_at: string;
  updated_at: string;
  event?: ApiEvent;
  user?: { id: number; name: string; email: string };
}

export interface ApiNotification {
  id: string;
  type: string;
  notifiable_type: string;
  notifiable_id: number;
  data: { event_id: number; event_title: string; status: string; message: string };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// API call functions
// ---------------------------------------------------------------------------

export const authApi = {
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) =>
    api.post<{ user: ApiUser; token: string }>("/register", data),
  login: (data: { email: string; password: string }) =>
    api.post<{ user: ApiUser; token: string }>("/login", data),
  logout: () => api.post("/logout"),
  me: () => api.get<ApiUser>("/me"),
};

export const eventsApi = {
  all: () => api.get<ApiEvent[]>("/events"),
  get: (id: string | number) => api.get<ApiEvent>(`/events/${id}`),
  create: (data: object) => api.post<ApiEvent>("/events", data),
  update: (id: string | number, data: object) => api.put<ApiEvent>(`/events/${id}`, data),
  cancel: (id: string | number) => api.delete(`/events/${id}`),
};

export const registrationsApi = {
  myRegistrations: () => api.get<ApiRegistration[]>("/my-registrations"),
  organizerRegistrations: () => api.get<ApiRegistration[]>("/organizer/registrations"),
  eventRegistrations: (eventId: string | number) =>
    api.get<ApiRegistration[]>(`/events/${eventId}/registrations`),
  register: (eventId: string | number) =>
    api.post<ApiRegistration>(`/events/${eventId}/registrations`),
  cancel: (registrationId: string | number) =>
    api.delete(`/registrations/${registrationId}`),
  markAttendance: (registrationId: string | number, attendance: AttendanceStatus) =>
    api.put<ApiRegistration>(`/registrations/${registrationId}/attendance`, { attendance }),
};

export const notificationsApi = {
  all: () => api.get<ApiNotification[]>("/notifications"),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
};

export const uploadApi = {
  image: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<{ url: string }>("/upload", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const adminApi = {
  users: () => api.get<ApiUser[]>("/admin/users"),
  createOrganizer: (data: { name: string; email: string; password: string }) =>
    api.post<ApiUser>("/admin/organizers", data),
  promoteUser: (userId: string | number) =>
    api.put<ApiUser>(`/admin/users/${userId}/promote`),
};

export default api;
