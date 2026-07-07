import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AdminDashboard } from "../../pages/AdminDashboard";
import type { ApiUser } from "../../lib/api";
import { renderWithRouter } from "../testUtils";

const api = vi.hoisted(() => ({
  users: vi.fn(),
  createOrganizer: vi.fn(),
  promoteUser: vi.fn(),
}));
const toast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}));

vi.mock("../../lib/api", () => ({
  adminApi: api,
}));

vi.mock("sonner", () => ({ toast }));

const organizer = (overrides: Partial<ApiUser> = {}): ApiUser => ({
  id: 10_001,
  name: "New Organizer",
  email: "new.organizer@example.com",
  role: "organizer",
  email_verified_at: null,
  created_at: "2026-01-01T08:00:00.000Z",
  updated_at: "2026-01-01T08:00:00.000Z",
  ...overrides,
});

const existingUser = (overrides: Partial<ApiUser> = {}): ApiUser => ({
  id: 1,
  name: "Current User",
  email: "existing@tipon.test",
  role: "participant",
  email_verified_at: null,
  created_at: "2026-01-01T08:00:00.000Z",
  updated_at: "2026-01-01T08:00:00.000Z",
  ...overrides,
});

describe("Create Organizer Dialog UI", () => {
  beforeEach(() => {
    api.users.mockReset();
    api.createOrganizer.mockReset();
    api.promoteUser.mockReset();
    api.users.mockResolvedValue({ data: [existingUser()] });
    toast.error.mockReset();
    toast.success.mockReset();
  });

  const openDialog = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole("button", { name: "New Organizer" }));
  };

  const fillOrganizerForm = ({
    name,
    email,
    password,
    confirmPassword,
  }: {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => {
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: name } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: confirmPassword },
    });
  };

  it("blocks submit when password is weak", async () => {
    const user = userEvent.setup();
    api.createOrganizer.mockResolvedValue({ data: organizer() });

    renderWithRouter(React.createElement(AdminDashboard));

    await openDialog(user);
    fillOrganizerForm({
      name: "Organizer User",
      email: "new@example.com",
      password: "weak",
      confirmPassword: "weak",
    });

    expect(screen.getByRole("button", { name: "Create organizer" })).toBeDisabled();
    expect(api.createOrganizer).not.toHaveBeenCalled();
  });

  it("blocks submit when passwords do not match", async () => {
    const user = userEvent.setup();
    api.createOrganizer.mockResolvedValue({ data: organizer() });

    renderWithRouter(React.createElement(AdminDashboard));

    await openDialog(user);
    fillOrganizerForm({
      name: "Organizer User",
      email: "new@example.com",
      password: "StrongPass1!",
      confirmPassword: "DifferentPass2!",
    });

    expect(screen.getByRole("button", { name: "Create organizer" })).toBeDisabled();
    expect(api.createOrganizer).not.toHaveBeenCalled();
  });

  it("normalizes email to lowercase before create", async () => {
    const user = userEvent.setup();
    api.createOrganizer.mockResolvedValue({ data: organizer({ email: "clean@example.test" }) });

    renderWithRouter(React.createElement(AdminDashboard));

    await openDialog(user);
    fillOrganizerForm({
      name: "Organizer User",
      email: "NEW.ORGANIZER@TIPON.TEST",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });
    await user.click(screen.getByRole("button", { name: "Create organizer" }));

    await waitFor(() =>
      expect(api.createOrganizer).toHaveBeenCalledWith({
        name: "Organizer User",
        email: "new.organizer@tipon.test",
        password: "StrongPass1!",
      }),
    );
  });

  it("adds newly created organizer to the table", async () => {
    const user = userEvent.setup();
    const nextOrganizer = organizer({ id: 99, name: "Added Organizer", email: "added@tipon.test" });
    api.createOrganizer.mockResolvedValue({ data: nextOrganizer });

    renderWithRouter(React.createElement(AdminDashboard));

    await screen.findByText("Current User");
    await openDialog(user);
    fillOrganizerForm({
      name: "Added Organizer",
      email: "ADDED@TIPON.TEST",
      password: "StrongPass1!",
      confirmPassword: "StrongPass1!",
    });
    await user.click(screen.getByRole("button", { name: "Create organizer" }));

    expect(await screen.findByText("Added Organizer")).toBeInTheDocument();
    expect(screen.getByText("added@tipon.test")).toBeInTheDocument();
  });
});
