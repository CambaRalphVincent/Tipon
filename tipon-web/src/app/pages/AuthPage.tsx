import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { BrandLogo } from "../components/BrandLogo";
import { useAppStore } from "../store/AppStore";
import type { UserRole } from "../data/mockData";

export function AuthPage() {
  const navigate = useNavigate();
  const { login, registerParticipant } = useAppStore();
  const [mode, setMode] = useState<"login" | "register">("login");

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
                if (res.ok && res.role) routeForRole(res.role);
              }}
              onCreateAccount={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              onBack={() => setMode("login")}
              onRegister={async (name, email, password) => {
                const res = await registerParticipant(name, email, password);
                if (res.ok && res.role) routeForRole(res.role);
              }}
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    await onRegister(name, email, password);
    setLoading(false);
  };

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
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create account & continue"}
        </Button>
      </form>
    </div>
  );
}
