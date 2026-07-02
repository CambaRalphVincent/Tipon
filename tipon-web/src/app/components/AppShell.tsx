import { type ReactNode, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Ticket,
  Users,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { cn } from "./ui/utils";
import { NotificationBell } from "./NotificationBell";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { BrandLogo } from "./BrandLogo";
import { useAppStore } from "../store/AppStore";
import { LIVEWIRE_BASE_URL } from "../lib/api";

interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  // True for routes served directly by tipon-api's Livewire pages (a
  // different origin in dev) — these need a real, absolute-URL browser
  // navigation, not React Router's client-side routing.
  hardNavigate?: boolean;
}

const PARTICIPANT_NAV: NavItem[] = [
  { to: "/events", label: "Browse Events", icon: CalendarDays, hardNavigate: true },
  { to: "/my-registrations", label: "My Registrations", icon: Ticket },
];

const ORGANIZER_NAV: NavItem[] = [
  { to: "/organizer", label: "Dashboard", icon: LayoutDashboard },
  { to: "/organizer/events", label: "Manage Events", icon: ListChecks },
];

const ADMIN_NAV: NavItem[] = [
  { to: "/admin", label: "User Management", icon: Users },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role, currentUser, logout } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const items = role === "admin" ? ADMIN_NAV : role === "organizer" ? ORGANIZER_NAV : PARTICIPANT_NAV;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <a href={`${LIVEWIRE_BASE_URL}/events`} className="block px-2 py-1" onClick={onNavigate}>
        <BrandLogo layout="horizontal" />
      </a>

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active =
            location.pathname === item.to ||
            (item.to !== "/organizer" && location.pathname.startsWith(item.to));
          const linkClassName = cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            active
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          );
          return item.hardNavigate ? (
            <a key={item.to} href={`${LIVEWIRE_BASE_URL}${item.to}`} onClick={onNavigate} className={linkClassName}>
              <item.icon className="size-4" />
              {item.label}
            </a>
          ) : (
            <Link key={item.to} to={item.to} onClick={onNavigate} className={linkClassName}>
              <item.icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <Separator />
        <div className="flex items-center gap-3 px-2">
          <Avatar className="size-9">
            <AvatarFallback>
              {currentUser.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{currentUser.name}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          onClick={async () => {
            onNavigate?.();
            await logout();
            navigate("/");
          }}
        >
          <LogOut className="size-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r md:block">
        <div className="sticky top-0 h-screen">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r bg-background">
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b bg-background/80 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-1">
            <ThemeSwitcher />
            <NotificationBell />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
