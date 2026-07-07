import { describe, expect, it } from "vitest";

import {
  getHomeHrefForRole,
  getNavigationItemsForRole,
  isNavigationItemActive,
} from "../../lib/navigation";

describe("role navigation", () => {
  it("shows participant navigation only for participant workflows", () => {
    expect(getNavigationItemsForRole("participant").map((item) => item.label)).toEqual([
      "Browse Events",
      "My Registrations",
    ]);
  });

  it("shows organizer navigation only for organizer workflows", () => {
    expect(getNavigationItemsForRole("organizer").map((item) => item.label)).toEqual([
      "Dashboard",
      "Manage Events",
    ]);
  });

  it("shows admin navigation only for admin workflows", () => {
    expect(getNavigationItemsForRole("admin").map((item) => item.label)).toEqual(["User Management"]);
  });

  it("returns the correct home href for each role", () => {
    expect(getHomeHrefForRole("participant", "http://localhost:8000")).toBe("http://localhost:8000/events");
    expect(getHomeHrefForRole("organizer", "http://localhost:8000")).toBe("/organizer");
    expect(getHomeHrefForRole("admin", "http://localhost:8000")).toBe("/admin");
  });

  it("marks nested navigation paths active", () => {
    expect(isNavigationItemActive("/organizer/events/123", { to: "/organizer/events", label: "Manage Events" })).toBe(true);
    expect(isNavigationItemActive("/organizer/events", { to: "/organizer", label: "Dashboard" })).toBe(false);
  });
});
