import React from "react";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { EventItem, User } from "../../data/mockData";
import { ManageEvents } from "../../pages/ManageEvents";
import { renderWithRouter } from "../testUtils";

const store = vi.hoisted(() => ({
  currentUser: { id: "org-1", name: "Organizer", email: "o@tipon.test", role: "organizer" } as User,
  events: [] as EventItem[],
  confirmedCountFor: vi.fn(),
  cancelEvent: vi.fn(),
}));

const navigate = vi.hoisted(() => vi.fn());

vi.mock("react-router", async (importOriginal) => {
  const original = await importOriginal<typeof import("react-router")>();
  return {
    ...original,
    useNavigate: () => navigate,
  };
});

vi.mock("../../store/AppStore", () => ({
  useAppStore: () => store,
}));

vi.mock("../../components/EventFormDialog", () => ({
  EventFormDialog: ({ trigger }: { trigger: React.ReactNode }) => <div>{trigger}</div>,
}));

vi.mock("../../components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    onClick,
    disabled,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
  }) => (
    <button type="button" disabled={disabled} onClick={onClick} className="dropdown-item">
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <hr />,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("../../components/ui/alert-dialog", () => ({
  AlertDialog: ({ children, open }: { children: React.ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
  AlertDialogAction: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick} data-testid="manage-cancel-confirm">
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

const event = (overrides: Partial<EventItem>): EventItem => ({
  id: "event-default",
  organizerId: "org-1",
  title: "Default Event",
  description: "Default description",
  venue: "Default Venue",
  eventDate: "2026-07-08T08:00:00",
  capacity: 10,
  status: "open",
  cover_image_path: "",
  registeredCount: 0,
  ...overrides,
});

describe("ManageEvents UI", () => {
  beforeEach(() => {
    store.events = [];
    store.confirmedCountFor.mockReset().mockReturnValue(0);
    store.cancelEvent.mockReset();
    navigate.mockReset();
  });

  it("shows only the current organizer's events", async () => {
    store.events = [
      event({ id: "mine-1", title: "My Event 1" }),
      event({ id: "mine-2", title: "My Event 2" }),
      event({ id: "other", title: "Other Organizer Event", organizerId: "org-2" }),
    ];
    store.confirmedCountFor.mockReturnValue(4);

    renderWithRouter(React.createElement(ManageEvents));

    expect(await screen.findByText("My Event 1")).toBeInTheDocument();
    expect(screen.getByText("My Event 2")).toBeInTheDocument();
    expect(screen.queryByText("Other Organizer Event")).not.toBeInTheDocument();
  });

  it("filters events by All, Open, Completed, and Cancelled", async () => {
    const user = userEvent.setup();
    store.events = [
      event({ id: "open", title: "Open Event", status: "open", eventDate: "2026-07-10T08:00:00" }),
      event({ id: "complete", title: "Completed Event", status: "completed", eventDate: "2026-07-09T08:00:00" }),
      event({ id: "cancel", title: "Cancelled Event", status: "cancelled", eventDate: "2026-07-08T08:00:00" }),
    ];
    store.confirmedCountFor.mockReturnValue(1);

    renderWithRouter(React.createElement(ManageEvents));

    expect(await screen.findByText("Open Event")).toBeInTheDocument();
    expect(screen.getByText("Completed Event")).toBeInTheDocument();
    expect(screen.getByText("Cancelled Event")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open/ }));
    expect(screen.getByText("Open Event")).toBeInTheDocument();
    expect(screen.queryByText("Completed Event")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancelled Event")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Completed/ }));
    expect(screen.getByText("Completed Event")).toBeInTheDocument();
    expect(screen.queryByText("Open Event")).not.toBeInTheDocument();
    expect(screen.queryByText("Cancelled Event")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cancelled/ }));
    expect(screen.getByText("Cancelled Event")).toBeInTheDocument();
    expect(screen.queryByText("Open Event")).not.toBeInTheDocument();
    expect(screen.queryByText("Completed Event")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: (name) => name.includes("All"),
      }),
    );
    expect(screen.getByText("Open Event")).toBeInTheDocument();
    expect(screen.getByText("Completed Event")).toBeInTheDocument();
    expect(screen.getByText("Cancelled Event")).toBeInTheDocument();
  });

  it("displays correct filter counts", () => {
    store.events = [
      event({ id: "open-1", title: "Open Event 1", status: "open" }),
      event({ id: "open-2", title: "Open Event 2", status: "open" }),
      event({ id: "complete-1", title: "Completed Event", status: "completed" }),
      event({ id: "cancel-1", title: "Cancelled Event", status: "cancelled" }),
    ];

    renderWithRouter(React.createElement(ManageEvents));

    expect(
      screen.getByRole("button", {
        name: (name) => name.includes("All") && name.includes("4"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: (name) => name.includes("Open") && name.includes("2"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: (name) => name.includes("Completed") && name.includes("1"),
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: (name) => name.includes("Cancelled") && name.includes("1"),
      }),
    ).toBeInTheDocument();
  });

  it("disables edit for completed events and cancel for completed/cancelled events", async () => {
    store.events = [
      event({ id: "open", title: "Open Event", status: "open" }),
      event({ id: "completed", title: "Completed Event", status: "completed" }),
      event({ id: "cancelled", title: "Cancelled Event", status: "cancelled" }),
    ];

    renderWithRouter(React.createElement(ManageEvents));
    await screen.findByText("Open Event");

    const completedRow = screen.getByRole("row", { name: /Completed Event/ });
    const cancelledRow = screen.getByRole("row", { name: /Cancelled Event/ });

    expect(within(completedRow).getByRole("button", { name: /Edit/ })).toBeDisabled();
    expect(within(completedRow).getByRole("button", { name: /Cancel event/ })).toBeDisabled();
    expect(within(cancelledRow).getByRole("button", { name: /Cancel event/ })).toBeDisabled();
  });

  it("navigates to the registrant list when a row is clicked", async () => {
    const user = userEvent.setup();
    store.events = [event({ id: "navigate-me", title: "Navigate Event", status: "open" })];

    renderWithRouter(React.createElement(ManageEvents));

    await user.click(screen.getByRole("row", { name: /Navigate Event/ }));
    expect(navigate).toHaveBeenCalledWith("/organizer/events/navigate-me");
  });

  it("calls cancelEvent after cancel confirmation", async () => {
    const user = userEvent.setup();
    store.events = [event({ id: "cancel-me", title: "Cancel Me", status: "open" })];

    renderWithRouter(React.createElement(ManageEvents));
    await screen.findByText("Cancel Me");
    const row = screen.getByRole("row", { name: /Cancel Me/ });
    await user.click(within(row).getByRole("button", { name: /Cancel event/ }));
    await user.click(screen.getByTestId("manage-cancel-confirm"));

    expect(store.cancelEvent).toHaveBeenCalledWith("cancel-me");
  });
});
