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
import {
  getHomeHrefForRole,
  getNavigationItemsForRole,
  isNavigationItemActive,
} from "../lib/navigation";

interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  // True for routes served directly by tipon-api's Livewire pages (a
  // different origin in dev) — these need a real, absolute-URL browser
  // navigation, not React Router's client-side routing.
  hardNavigate?: boolean;
}

const NAV_ICONS: Record<string, NavItem["icon"]> = {
  "/events": CalendarDays,
  "/my-registrations": Ticket,
  "/organizer": LayoutDashboard,
  "/organizer/events": ListChecks,
  "/admin": Users,
};

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { role, currentUser, logout } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const displayName = currentUser?.name ?? "User";
  const initials = displayName
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2);
  const items = getNavigationItemsForRole(role);
  const homeHref = getHomeHrefForRole(role, LIVEWIRE_BASE_URL);
  const logo = <BrandLogo layout="horizontal" />;

  return (
    <div className="flex h-full flex-col gap-6 p-4">
      {role === "participant" ? (
        <a href={homeHref} className="block px-2 py-1" onClick={onNavigate}>
          {logo}
        </a>
      ) : (
        <Link to={homeHref} className="block px-2 py-1" onClick={onNavigate}>
          {logo}
        </Link>
      )}

      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isNavigationItemActive(location.pathname, item);
          const Icon = NAV_ICONS[item.to];
          const linkClassName = cn(
            "flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors",
            active
              ? "border-primary/20 bg-primary/10 font-medium text-primary"
              : "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          );
          return item.hardNavigate ? (
            <a key={item.to} href={`${LIVEWIRE_BASE_URL}${item.to}`} onClick={onNavigate} className={linkClassName}>
              <Icon className="size-4" />
              {item.label}
            </a>
          ) : (
            <Link key={item.to} to={item.to} onClick={onNavigate} className={linkClassName}>
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <Separator />
        <div className="flex items-center gap-3 px-2">
          <Avatar className="size-9">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-xs font-bold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium">{displayName}</p>
            <p className="truncate text-xs capitalize text-muted-foreground">{role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start rounded-xl px-3 py-2"
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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
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

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
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
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
