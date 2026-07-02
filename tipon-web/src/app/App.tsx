import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/AppShell";
import { AppStoreProvider, useAppStore } from "./store/AppStore";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthPage } from "./pages/AuthPage";
import { MyRegistrations } from "./pages/MyRegistrations";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { ManageEvents } from "./pages/ManageEvents";
import { RegistrantList } from "./pages/RegistrantList";
import { AdminDashboard } from "./pages/AdminDashboard";
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <p className="text-sm text-muted-foreground">Redirecting…</p>
    </div>
  );
}

function AppRoutes() {
  const { initialized, currentUser, role } = useAppStore();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
