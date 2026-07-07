import { describe, expect, it } from "vitest";

import { getAuthRedirectTarget, passwordMeetsAllRules } from "../../lib/authFlow";
import { PASSWORD_RULES } from "../../lib/passwordRules";

describe("auth login routing", () => {
  const livewireBaseUrl = "http://localhost:8000";

  it("routes admins to the admin dashboard", () => {
    expect(getAuthRedirectTarget("admin", livewireBaseUrl)).toEqual({
      kind: "spa",
      path: "/admin",
    });
  });

  it("routes organizers to the organizer dashboard", () => {
    expect(getAuthRedirectTarget("organizer", livewireBaseUrl)).toEqual({
      kind: "spa",
      path: "/organizer",
    });
  });

  it("routes participants to the Livewire browse events page", () => {
    expect(getAuthRedirectTarget("participant", livewireBaseUrl)).toEqual({
      kind: "external",
      href: "http://localhost:8000/events",
    });
  });
});

describe("participant registration password rules", () => {
  it("accepts a password that satisfies all rules", () => {
    expect(passwordMeetsAllRules("StrongPass1!", PASSWORD_RULES)).toBe(true);
  });

  it("rejects a weak password", () => {
    expect(passwordMeetsAllRules("password", PASSWORD_RULES)).toBe(false);
  });
});
