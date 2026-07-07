import { useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { BrandLogo } from "../components/BrandLogo";
import { cn } from "../components/ui/utils";
import { LIVEWIRE_BASE_URL } from "../lib/api";
import { getAuthRedirectTarget } from "../lib/authFlow";
import { PASSWORD_RULES } from "../lib/passwordRules";
import { useAppStore } from "../store/AppStore";
import type { UserRole } from "../data/mockData";

// Matches BrandLogo.tsx's existing use of a second display typeface for
// headings, loaded in src/styles/fonts.css alongside Plus Jakarta Sans.
const DISPLAY_FONT = "'Bricolage Grotesque', sans-serif";

const LABEL_CLASS = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

export function AuthPage() {
  const navigate = useNavigate();
  const { login, registerParticipant, verifyEmailOtp, resendVerificationCode } = useAppStore();
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [pendingEmail, setPendingEmail] = useState("");

  const routeForRole = (role: UserRole) => {
    const target = getAuthRedirectTarget(role, LIVEWIRE_BASE_URL);
    if (target.kind === "spa") navigate(target.path);
    // /events is served directly by tipon-api's Livewire page — a real,
    // absolute-URL navigation, not React Router's client-side routing.
    else window.location.href = target.href;
  };

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Brand panel — wider than the form panel (58/42 instead of 50/50).
          Decorative layers: a diagonal gradient between theme tokens, a
          radial glow toward the upper-middle, and a faint dot-grid texture.
          All colors route through the existing CSS custom properties, so
          this still responds correctly to the theme switcher (gold/teal/
          sunset) instead of being locked to one fixed palette. */}
      <div className="relative hidden w-[58%] flex-col justify-between overflow-hidden p-14 md:flex">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--background) 0%, var(--card) 45%, var(--background) 100%)",
          }}
        />
        <div className="absolute left-[35%] top-[30%] size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: "radial-gradient(circle, var(--foreground) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        <div className="relative z-10">
          <BrandLogo layout="horizontal" />
        </div>

        <div className="relative z-10 max-w-md space-y-6">
          <h1
            className="text-5xl font-extrabold leading-[1.1] tracking-tight"
            style={{ fontFamily: DISPLAY_FONT }}
          >
            Gather.
            <br />
            Register.
            <br />
            <span className="text-primary">Celebrate.</span>
          </h1>
          <p className="max-w-xs text-base leading-relaxed text-muted-foreground">
            Browse seminars and workshops, secure your slot, and track attendance — all from a
            single centralized platform.
          </p>
        </div>

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
            <ShieldCheck className="size-3.5" /> Secure, role-based access
          </span>
        </div>
      </div>

      {/* Form panel — full width on mobile (42% on desktop), where the
          brand panel above is hidden. A compact logo appears here instead,
          so mobile visitors still see the Tipon brand. */}
      <div className="relative flex w-full flex-col md:w-[42%]">
        <div className="flex items-center justify-between p-4 sm:p-8 md:justify-end">
          <div className="origin-left scale-90 md:hidden">
            <BrandLogo layout="horizontal" />
          </div>
          <div className="rounded-full border border-primary/10 bg-card/60 p-1 shadow-sm">
            <ThemeSwitcher />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 pt-0 sm:p-12 sm:pt-0">
          <div className="w-full max-w-md">
            {mode === "login" ? (
              <LoginForm
                onSignIn={async (email, password) => {
                  const res = await login(email, password);
                  if (res.ok && res.role) {
                    routeForRole(res.role);
                  } else if (res.requiresVerification) {
                    setPendingEmail(res.email ?? email);
                    setMode("verify");
                  }
                }}
                onCreateAccount={() => setMode("register")}
              />
            ) : mode === "register" ? (
              <RegisterForm
                onBack={() => setMode("login")}
                onRegister={async (name, email, password) => {
                  const res = await registerParticipant(name, email, password);
                  if (res.ok && res.requiresVerification) {
                    setPendingEmail(res.email ?? email);
                    setMode("verify");
                  }
                }}
              />
            ) : (
              <VerifyOtpForm
                email={pendingEmail}
                onBack={() => setMode("login")}
                onVerify={async (code) => {
                  const res = await verifyEmailOtp(pendingEmail, code);
                  if (res.ok && res.role) routeForRole(res.role);
                  return res.ok;
                }}
                onResend={() => resendVerificationCode(pendingEmail)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  minLength,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  minLength?: number;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id={id}
        type={visible ? "text" : "password"}
        className="pl-9 pr-9"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        minLength={minLength}
        required
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

function LoginForm({
  onSignIn,
  onCreateAccount,
}: {
  onSignIn: (email: string, password: string) => Promise<void>;
  onCreateAccount: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSignIn(email, password);
    setLoading(false);
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: DISPLAY_FONT }}>
          Welcome back
        </h2>
        <p className="text-sm text-muted-foreground">
          Sign in to your Tipon account to continue.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className={LABEL_CLASS}>Email</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            className="pl-9"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className={LABEL_CLASS}>Password</Label>
        <PasswordInput id="password" value={password} onChange={setPassword} placeholder="••••••••" />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <div className="rounded-xl border border-primary/10 bg-foreground/[0.03] px-3.5 py-2.5 text-sm text-muted-foreground">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Organizer account? Use the password from your administrator, then verify
            the email code sent to your inbox.
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        New to Tipon?{" "}
        <button
          type="button"
          onClick={onCreateAccount}
          className="font-medium text-primary hover:underline"
        >
          Create an account
        </button>
      </p>
    </form>
  );
}

function RegisterForm({
  onBack,
  onRegister,
}: {
  onBack: () => void;
  onRegister: (name: string, email: string, password: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passedRules = PASSWORD_RULES.filter((rule) => rule.test(password));
  const passwordStrong = passedRules.length === PASSWORD_RULES.length;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const canSubmit = passwordStrong && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordStrong) {
      toast.error("Password does not meet the strength requirements.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    await onRegister(name, email, password);
    setLoading(false);
  };

  const strengthColor =
    passedRules.length <= 2 ? "bg-red-500" : passedRules.length <= 4 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
        <ArrowLeft className="size-4" /> Back to sign in
      </Button>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: DISPLAY_FONT }}>
            Create your account
          </h2>
          <p className="text-sm text-muted-foreground">
            Register as a participant to browse and book events. Organizer accounts are
            provisioned by an administrator.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="r-name" className={LABEL_CLASS}>Full name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="r-name"
              className="pl-9"
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="r-email" className={LABEL_CLASS}>Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="r-email"
              type="email"
              className="pl-9"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="r-password" className={LABEL_CLASS}>Password</Label>
          <PasswordInput
            id="r-password"
            value={password}
            onChange={setPassword}
            placeholder="Min. 8 characters"
            minLength={8}
          />

          {password.length > 0 && (
            <div className="space-y-2 pt-1">
              <div className="flex gap-1">
                {PASSWORD_RULES.map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      i < passedRules.length ? strengthColor : "bg-muted",
                    )}
                  />
                ))}
              </div>
              <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
                {PASSWORD_RULES.map((rule) => {
                  const passed = rule.test(password);
                  return (
                    <li
                      key={rule.label}
                      className={cn(
                        "flex items-center gap-1.5",
                        passed ? "text-emerald-500" : "text-muted-foreground",
                      )}
                    >
                      {passed ? <Check className="size-3.5 shrink-0" /> : <X className="size-3.5 shrink-0" />}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="r-confirm" className={LABEL_CLASS}>Confirm password</Label>
          <PasswordInput
            id="r-confirm"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter your password"
          />
          {confirmPassword.length > 0 && (
            <p
              className={cn(
                "flex items-center gap-1.5 text-xs",
                passwordsMatch ? "text-emerald-500" : "text-red-500",
              )}
            >
              {passwordsMatch ? <Check className="size-3.5 shrink-0" /> : <X className="size-3.5 shrink-0" />}
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading || !canSubmit}>
          {loading ? "Creating account…" : "Create account & continue"}
        </Button>
      </form>
    </div>
  );
}

function VerifyOtpForm({
  email,
  onBack,
  onVerify,
  onResend,
}: {
  email: string;
  onBack: () => void;
  onVerify: (code: string) => Promise<boolean>;
  onResend: () => Promise<boolean>;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await onVerify(code);
    setLoading(false);
    if (!ok) setCode("");
  };

  const handleResend = async () => {
    setResending(true);
    await onResend();
    setResending(false);
  };

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
        <ArrowLeft className="size-4" /> Back to sign in
      </Button>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-3xl font-bold tracking-tight" style={{ fontFamily: DISPLAY_FONT }}>
            Verify your email
          </h2>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code we sent to <span className="font-medium">{email}</span>.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp-code" className={LABEL_CLASS}>Verification code</Label>
          <div className="relative">
            <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="otp-code"
              inputMode="numeric"
              className="pl-9 tracking-widest"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
          {loading ? "Verifying…" : "Verify & continue"}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Didn't get a code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="font-medium text-primary hover:underline disabled:opacity-50"
          >
            {resending ? "Resending…" : "Resend code"}
          </button>
        </p>
      </form>
    </div>
  );
}
