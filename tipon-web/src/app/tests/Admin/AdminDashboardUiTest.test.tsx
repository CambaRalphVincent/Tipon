import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDashboard } from "../../pages/AdminDashboard";
import type { ApiUser } from "../../lib/api";
import { renderWithRouter } from "../testUtils";

const api = vi.hoisted(() => ({
  users: vi.fn(),
  promoteUser: vi.fn(),
}));
const toast = vi.hoisted(() => ({
  error: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  adminApi: api,
}));

vi.mock("sonner", () => ({ toast }));

vi.mock("../../components/ui/alert-dialog", () => ({
  AlertDialog: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick} data-testid="admin-promote-confirm">
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  AlertDialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogDescription: ({ children }: { children: React.ReactNode }) => <p>{children}</p>,
  AlertDialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  AlertDialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

const apiUser = (overrides: Partial<ApiUser>): ApiUser => ({
  id: 1,
  name: "Participant One",
  email: "p.one@example.com",
  role: "participant",
  email_verified_at: null,
  created_at: "2026-01-01T08:00:00.000Z",
  updated_at: "2026-01-01T08:00:00.000Z",
  ...overrides,
});

describe("AdminDashboard UI", () => {
  beforeEach(() => {
    api.users.mockReset();
    api.promoteUser.mockReset();
    toast.error.mockReset();
  });

  it("loads and displays users from adminApi.users", async () => {
    api.users.mockResolvedValue({
      data: [
        apiUser({ id: 1, name: "Alice Doe", email: "alice@tipon.test", role: "participant" }),
        apiUser({ id: 2, name: "Bob Admin", email: "bob@tipon.test", role: "organizer" }),
      ],
    });

    renderWithRouter(React.createElement(AdminDashboard));

    expect(await screen.findByText("Alice Doe")).toBeInTheDocument();
    expect(screen.getByText("alice@tipon.test")).toBeInTheDocument();
    expect(screen.getByText("Bob Admin")).toBeInTheDocument();
    expect(screen.getByText("bob@tipon.test")).toBeInTheDocument();
  });

  it("shows loading state before users load", async () => {
    let resolver: (value: { data: ApiUser[] }) => void = () => {};
    api.users.mockImplementation(
      () =>
        new Promise<{ data: ApiUser[] }>((resolve) => {
          resolver = resolve as (value: { data: ApiUser[] }) => void;
        }),
    );

    renderWithRouter(React.createElement(AdminDashboard));

    expect(screen.getByText("Loading users...")).toBeInTheDocument();

    resolver({
      data: [
        apiUser({
          id: 3,
          name: "Clara Organizer",
          email: "clara@tipon.test",
          role: "organizer",
        }),
      ],
    });

    expect(await screen.findByText("Clara Organizer")).toBeInTheDocument();
  });

  it("filters users by name and email", async () => {
    const users = [
      apiUser({ id: 1, name: "Alice", email: "alice@tipon.test", role: "participant" }),
      apiUser({ id: 2, name: "Bob", email: "bob@tipon.test", role: "organizer" }),
    ];
    api.users.mockResolvedValue({ data: users });

    const user = userEvent.setup();
    renderWithRouter(React.createElement(AdminDashboard));

    await screen.findByText("Alice");
    await user.type(screen.getByPlaceholderText("Search users..."), "alice");

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("Search users..."));
    await user.type(screen.getByPlaceholderText("Search users..."), "BOB@TIPON");

    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("shows participant and organizer counts correctly", async () => {
    api.users.mockResolvedValue({
      data: [
        apiUser({ id: 1, name: "Alice", role: "participant" }),
        apiUser({ id: 2, name: "Beth", role: "participant" }),
        apiUser({ id: 3, name: "Cal", role: "organizer" }),
      ],
    });

    renderWithRouter(React.createElement(AdminDashboard));

    await screen.findByText("Alice");

    const participantCount = screen.getByText("Participants").nextSibling;
    const organizerCount = screen.getByText("Organizers").nextSibling;

    expect(participantCount).toHaveTextContent("2");
    expect(organizerCount).toHaveTextContent("1");
  });

  it("promotes a participant to organizer after confirmation", async () => {
    const participants = apiUser({
      id: 10,
      name: "Promote Me",
      email: "promote@tipon.test",
      role: "participant",
    });
    const promoted = { ...participants, role: "organizer" as const };
    api.users.mockResolvedValue({ data: [participants] });
    api.promoteUser.mockResolvedValue({ data: promoted });

    const user = userEvent.setup();
    renderWithRouter(React.createElement(AdminDashboard));

    expect(await screen.findByText("Promote Me")).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /Promote Me/i });
    await user.click(within(row).getAllByRole("button", { name: "Promote" })[0]);
    await user.click(screen.getByTestId("admin-promote-confirm"));

    await waitFor(() => expect(api.promoteUser).toHaveBeenCalledWith(10));
    expect(row).toHaveTextContent("organizer");
  });

  it("handles failed user loading with an error toast", async () => {
    api.users.mockRejectedValue({
      response: { data: { message: "Failed to load users." } },
    });

    renderWithRouter(React.createElement(AdminDashboard));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("Failed to load users."),
    );
  });
});
