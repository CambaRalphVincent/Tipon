import type { UserRole } from "../data/mockData";

export interface NavigationItem {
  to: string;
  label: string;
  hardNavigate?: boolean;
}

export const PARTICIPANT_NAV_ITEMS: NavigationItem[] = [
  { to: "/events", label: "Browse Events", hardNavigate: true },
  { to: "/my-registrations", label: "My Registrations" },
];

export const ORGANIZER_NAV_ITEMS: NavigationItem[] = [
  { to: "/organizer", label: "Dashboard" },
  { to: "/organizer/events", label: "Manage Events" },
];

export const ADMIN_NAV_ITEMS: NavigationItem[] = [
  { to: "/admin", label: "User Management" },
  { to: "/admin/events", label: "Event Monitoring" },
];

export function getNavigationItemsForRole(role: UserRole): NavigationItem[] {
  if (role === "admin") return ADMIN_NAV_ITEMS;
  if (role === "organizer") return ORGANIZER_NAV_ITEMS;
  return PARTICIPANT_NAV_ITEMS;
}

export function getHomeHrefForRole(role: UserRole, livewireBaseUrl: string): string {
  if (role === "admin") return "/admin";
  if (role === "organizer") return "/organizer";
  return `${livewireBaseUrl}/events`;
}

export function isNavigationItemActive(pathname: string, item: NavigationItem): boolean {
  return pathname === item.to
    || (!["/organizer", "/admin"].includes(item.to) && pathname.startsWith(item.to));
}
