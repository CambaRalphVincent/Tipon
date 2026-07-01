import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, ClipboardList, Lock, Mail, ShieldCheck, Ticket, User } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ThemeSwitcher } from "../components/ThemeSwitcher";
import { BrandLogo } from "../components/BrandLogo";
import { useAppStore } from "../store/AppStore";
import type { UserRole } from "../data/mockData";

// Single login page. Credentials are sent to the (mock) backend, which
// determines whether the account is a participant or organizer.
export function AuthPage() {
  const navigate = useNavigate();
  const { login, registerParticipant } = useAppStore();
  const [mode, setMode] = useState<"login" | "register">("login");

  const routeForRole = (role: UserRole) =>
    navigate(role === "participant" ? "/events" : "/organizer");

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
              onSignIn={(email, password) => {
                const res = login(email, password);
                if (res.ok && res.role) routeForRole(res.role);
              }}
              onQuickLogin={(email) => {
                const res = login(email, "demo");
                if (res.ok && res.role) routeForRole(res.role);
              }}
              onCreateAccount={() => setMode("register")}
            />
          ) : (
            <RegisterForm
              onBack={() => setMode("login")}
              onRegister={(name, email) => {
                const res = registerParticipant(name, email);
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
  onQuickLogin,
  onCreateAccount,
}: {
  onSignIn: (email: string, password: string) => void;
  onQuickLogin: (email: string) => void;
  onCreateAccount: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSignIn(email, password);
      }}
    >
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

      <Button type="submit" className="w-full">
        Sign in
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to Tipon?{" "}
        <button type="button" onClick={onCreateAccount} className="font-medium text-primary hover:underline">
          Create an account
        </button>
      </p>

      <div className="space-y-2">
        <p className="text-center text-xs text-muted-foreground">Quick login for testing</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onQuickLogin("aisha.tan@student.edu")}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/50 hover:text-foreground"
          >
            <Ticket className="size-4 shrink-0 text-primary" />
            Participant
          </button>
          <button
            type="button"
            onClick={() => onQuickLogin("e.reyes@university.edu")}
            className="flex items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/50 hover:text-foreground"
          >
            <ClipboardList className="size-4 shrink-0 text-primary" />
            Organizer
          </button>
        </div>
      </div>
    </form>
  );
}

function RegisterForm({
  onBack,
  onRegister,
}: {
  onBack: () => void;
  onRegister: (name: string, email: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="space-y-5">
      <Button variant="ghost" size="sm" className="-ml-2" onClick={onBack}>
        <ArrowLeft className="size-4" /> Back to sign in
      </Button>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          onRegister(name, email);
        }}
      >
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
            <Input id="r-name" className="pl-9" placeholder="Jane Doe" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="r-email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="r-email" type="email" className="pl-9" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="r-password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="r-password" type="password" className="pl-9" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Create account &amp; continue
        </Button>
      </form>
    </div>
  );
}
