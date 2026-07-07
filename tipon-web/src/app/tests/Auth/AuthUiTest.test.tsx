import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthPage } from "../../pages/AuthPage";
import { renderWithRouter } from "../testUtils";

const store = vi.hoisted(() => ({
  login: vi.fn(),
  registerParticipant: vi.fn(),
  verifyEmailOtp: vi.fn(),
  resendVerificationCode: vi.fn(),
}));

vi.mock("../../store/AppStore", () => ({
  useAppStore: () => store,
}));

vi.mock("../../components/ThemeSwitcher", () => ({
  ThemeSwitcher: () => <button type="button">Theme</button>,
}));

describe("AuthPage UI", () => {
  beforeEach(() => {
    store.login.mockResolvedValue({ ok: false });
    store.registerParticipant.mockResolvedValue({ ok: false });
    store.verifyEmailOtp.mockResolvedValue({ ok: false });
    store.resendVerificationCode.mockResolvedValue(false);
  });

  it("submits login credentials", async () => {
    const user = userEvent.setup();
    store.login.mockResolvedValue({ ok: true, role: "organizer" });

    renderWithRouter(React.createElement(AuthPage));

    await user.type(screen.getByLabelText("Email"), "organizer@tipon.test");
    await user.type(screen.getByLabelText("Password"), "StrongPass1!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(store.login).toHaveBeenCalledWith("organizer@tipon.test", "StrongPass1!");
  });

  it("updates password checklist while registering", async () => {
    const user = userEvent.setup();

    renderWithRouter(React.createElement(AuthPage));
    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await user.type(screen.getByLabelText("Password"), "StrongPass1!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPass1!");

    expect(screen.getByText("At least 8 characters")).toBeInTheDocument();
    expect(screen.getByText("An uppercase letter")).toBeInTheDocument();
    expect(screen.getByText("Passwords match")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create account & continue" })).toBeEnabled();
  });

  it("moves to verification flow after successful registration and limits OTP to six digits", async () => {
    const user = userEvent.setup();
    store.registerParticipant.mockResolvedValue({
      ok: true,
      requiresVerification: true,
      email: "participant@tipon.test",
    });

    renderWithRouter(React.createElement(AuthPage));
    await user.click(screen.getByRole("button", { name: "Create an account" }));
    await user.type(screen.getByLabelText("Full name"), "Participant User");
    await user.type(screen.getByLabelText("Email"), "participant@tipon.test");
    await user.type(screen.getByLabelText("Password"), "StrongPass1!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPass1!");
    await user.click(screen.getByRole("button", { name: "Create account & continue" }));

    expect(await screen.findByText("Verify your email")).toBeInTheDocument();

    const code = screen.getByLabelText("Verification code") as HTMLInputElement;
    await user.type(code, "12ab345678");

    expect(code.value).toBe("123456");
    expect(screen.getByRole("button", { name: "Verify & continue" })).toBeEnabled();
  });
});
