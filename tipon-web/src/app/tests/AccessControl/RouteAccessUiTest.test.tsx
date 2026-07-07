import React from "react";
import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { User, UserRole } from "../../data/mockData";
import { AppRoutes } from "../../App";
import { renderWithRouter } from "../testUtils";

const store = vi.hoisted(() => ({
  initialized: true,
  currentUser: null as User | null,
  role: "participant" as UserRole,
  logout: vi.fn(),
}));

vi.mock("../../store/AppStore", () => ({
  useAppStore: () => store,
}));

vi.mock("../../components/AppShell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("../../pages/AuthPage", () => ({
  AuthPage: () => <div>Auth Page</div>,
}));

vi.mock("../../pages/MyRegistrations", () => ({
  MyRegistrations: () => <div>My Registrations Page</div>,
}));

vi.mock("../../pages/OrganizerDashboard", () => ({
  OrganizerDashboard: () => <div>Organizer Dashboard Page</div>,
}));

vi.mock("../../pages/ManageEvents", () => ({
  ManageEvents: () => <div>Manage Events Page</div>,
}));

vi.mock("../../pages/RegistrantList", () => ({
  RegistrantList: () => <div>Registrant List Page</div>,
}));

vi.mock("../../pages/AdminDashboard", () => ({
  AdminDashboard: () => <div>Admin Dashboard Page</div>,
}));

const user = (role: UserRole): User => ({
  id: `${role}-1`,
  name: `${role} user`,
  email: `${role}@tipon.test`,
  role,
});

describe("AppRoutes access control UI", () => {
  beforeEach(() => {
    store.initialized = true;
    store.currentUser = null;
    store.role = "participant";
  });

  it("redirects unauthenticated users to auth page", async () => {
    renderWithRouter(React.createElement(AppRoutes), ["/organizer"]);

    expect(await screen.findByText("Auth Page")).toBeInTheDocument();
  });

  it("allows organizers to render organizer pages", () => {
    store.currentUser = user("organizer");
    store.role = "organizer";

    renderWithRouter(React.createElement(AppRoutes), ["/organizer/events"]);

    expect(screen.getByText("Manage Events Page")).toBeInTheDocument();
  });

  it("allows admins to render admin pages", () => {
    store.currentUser = user("admin");
    store.role = "admin";

    renderWithRouter(React.createElement(AppRoutes), ["/admin"]);

    expect(screen.getByText("Admin Dashboard Page")).toBeInTheDocument();
  });

  it("blocks organizers from participant-only pages", async () => {
    store.currentUser = user("organizer");
    store.role = "organizer";

    renderWithRouter(React.createElement(AppRoutes), ["/my-registrations"]);

    expect(await screen.findByText("Organizer Dashboard Page")).toBeInTheDocument();
  });
});
