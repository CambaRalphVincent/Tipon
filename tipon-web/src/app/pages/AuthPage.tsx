import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, Lock, Mail, ShieldCheck, User, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { BrandLogo } from "../components/BrandLogo";
import { cn } from "../components/ui/utils";
import { useAppStore } from "../store/AppStore";
import type { UserRole } from "../data/mockData";

const PASSWORD_RULES: { label: string; test: (password: string) => boolean }[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "An uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "A lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "A number", test: (p) => /[0-9]/.test(p) },
  { label: "A special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function AuthPage() {
  const navigate = useNavigate();
  const { login, registerParticipant, verifyEmailOtp, resendVerificationCode } = useAppStore();
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [pendingEmail, setPendingEmail] = useState("");

  const routeForRole = (role: UserRole) => {
    if (role === "admin") navigate("/admin");
    else if (role === "organizer") navigate("/organizer");
    else navigate("/events");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="absolute right-4 top-4">
        <ThemeSwitcher />
      </div>
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border bg-card shadow-xl md:grid-cols-2">
        {/* Brand panel */}
        <div
          className="relative hidden flex-col justify-between p-8 md:flex"
          style={{
            backgroundImage:
              "linear-gradient(to bottom right, var(--brand-glow), var(--background), var(--background))",
          }}
        >
          <BrandLogo layout="stacked" />
          <div className="space-y-3">
            <h2 className="text-2xl font-semibold leading-tight">
              Gather. Register. Celebrate.
            </h2>
            <p className="text-sm text-muted-foreground">
              Browse seminars and workshops, secure your slot, and track attendance — all from a
              single centralized platform.
            </p>
          </div>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" /> Secure, role-based access
          </p>
        </div>

        {/* Action panel */}
        <div className="p-6 sm:p-8">
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to your Tipon account to continue.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
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
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            className="pl-9"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

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
          <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
          <p className="text-sm text-muted-foreground">
            Register as a participant to browse and book events. Organizer accounts are
            provisioned by an administrator.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="r-name">Full name</Label>
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
          <Label htmlFor="r-email">Email</Label>
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
          <Label htmlFor="r-password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="r-password"
              type="password"
              className="pl-9"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

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
          <Label htmlFor="r-confirm">Confirm password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="r-confirm"
              type="password"
              className="pl-9"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
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
          <h1 className="text-xl font-semibold tracking-tight">Verify your email</h1>
          <p className="text-sm text-muted-foreground">
            Enter the 6-digit code we sent to <span className="font-medium">{email}</span>.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp-code">Verification code</Label>
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
