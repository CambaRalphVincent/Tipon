import type { UserRole } from "../data/mockData";

export type AuthRedirectTarget =
  | { kind: "spa"; path: string }
  | { kind: "external"; href: string };

export function getAuthRedirectTarget(role: UserRole, livewireBaseUrl: string): AuthRedirectTarget {
  if (role === "admin") return { kind: "spa", path: "/admin" };
  if (role === "organizer") return { kind: "spa", path: "/organizer" };
  return { kind: "external", href: `${livewireBaseUrl}/events` };
}

export function passwordMeetsAllRules(password: string, rules: Array<{ test: (password: string) => boolean }>): boolean {
  return rules.every((rule) => rule.test(password));
}
