import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/AppShell";
import { BrandLogo } from "./components/BrandLogo";
import { AppStoreProvider, useAppStore } from "./store/AppStore";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthPage } from "./pages/AuthPage";
import { MyRegistrations } from "./pages/MyRegistrations";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { ManageEvents } from "./pages/ManageEvents";
import { RegistrantList } from "./pages/RegistrantList";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminEventMonitor } from "./pages/AdminEventMonitor";
import { LIVEWIRE_BASE_URL } from "./lib/api";

export default function App() {
  return (
    <ThemeProvider>
      <AppStoreProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        <Toaster theme="dark" richColors position="top-right" />
      </AppStoreProvider>
    </ThemeProvider>
  );
}

// /events and /events/:id are served directly by tipon-api's Livewire pages
// — a different origin in dev. React Router can't "navigate" there
// client-side, so this forces a real, absolute-URL browser navigation.
function HardRedirect({ to }: { to: string }) {
  const target = `${LIVEWIRE_BASE_URL}${to}`;

  useEffect(() => {
    window.location.href = target;
  }, [target]);

  return <RouteStatusScreen message="Opening events..." />;
}

function RouteStatusScreen({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex w-full max-w-sm flex-col items-center gap-5 text-center">
        <BrandLogo layout="stacked" className="[&_svg]:h-20 [&_svg]:w-20" />
        <div className="flex items-center gap-2 rounded-full border border-primary/15 bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  );
}

export function AppRoutes() {
  const { initialized, currentUser, role } = useAppStore();

  if (!initialized) {
    return <RouteStatusScreen message="Preparing your workspace..." />;
  }

  const loggedIn = !!currentUser;
  const isOrganizer = role === "organizer";
  const isAdmin = role === "admin";

  return (
    <Routes>
      {/* Auth — redirect to home if already logged in. /events is a
          Livewire page on a different origin, so that case needs a real
          navigation instead of client-side routing. */}
      <Route
        path="/"
        element={
          loggedIn ? (
            isAdmin ? (
              <Navigate to="/admin" replace />
            ) : isOrganizer ? (
              <Navigate to="/organizer" replace />
            ) : (
              <HardRedirect to="/events" />
            )
          ) : (
            <AuthPage />
          )
        }
      />

      {/* Participant routes. /events and /events/:id are handled by the
          Livewire pages in tipon-api directly — no React Router route for
          them here. */}
      <Route
        path="/my-registrations"
        element={
          loggedIn && !isOrganizer ? (
            <AppShell><MyRegistrations /></AppShell>
          ) : (
            <Navigate to={loggedIn ? "/organizer" : "/"} replace />
          )
        }
      />

      {/* Organizer routes */}
      <Route
        path="/organizer"
        element={
          loggedIn && isOrganizer ? (
            <AppShell><OrganizerDashboard /></AppShell>
          ) : loggedIn ? (
            <HardRedirect to="/events" />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/organizer/events"
        element={
          loggedIn && isOrganizer ? (
            <AppShell><ManageEvents /></AppShell>
          ) : loggedIn ? (
            <HardRedirect to="/events" />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/organizer/events/:id"
        element={
          loggedIn && isOrganizer ? (
            <AppShell><RegistrantList /></AppShell>
          ) : loggedIn ? (
            <HardRedirect to="/events" />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          loggedIn && isAdmin ? (
            <AppShell><AdminDashboard /></AppShell>
          ) : loggedIn && isOrganizer ? (
            <Navigate to="/organizer" replace />
          ) : loggedIn ? (
            <HardRedirect to="/events" />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/admin/events"
        element={
          loggedIn && isAdmin ? (
            <AppShell><AdminEventMonitor /></AppShell>
          ) : loggedIn && isOrganizer ? (
            <Navigate to="/organizer" replace />
          ) : loggedIn ? (
            <HardRedirect to="/events" />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
