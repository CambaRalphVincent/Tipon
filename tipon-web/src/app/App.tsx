import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/AppShell";
import { AppStoreProvider, useAppStore } from "./store/AppStore";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthPage } from "./pages/AuthPage";
import { EventsBrowse } from "./pages/EventsBrowse";
import { EventDetail } from "./pages/EventDetail";
import { MyRegistrations } from "./pages/MyRegistrations";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { ManageEvents } from "./pages/ManageEvents";
import { RegistrantList } from "./pages/RegistrantList";
import { AdminDashboard } from "./pages/AdminDashboard";

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
      {/* Auth — redirect to home if already logged in */}
      <Route
        path="/"
        element={
          loggedIn ? (
            <Navigate to={isAdmin ? "/admin" : isOrganizer ? "/organizer" : "/events"} replace />
          ) : (
            <AuthPage />
          )
        }
      />

      {/* Participant routes */}
      <Route
        path="/events"
        element={loggedIn ? <AppShell><EventsBrowse /></AppShell> : <Navigate to="/" replace />}
      />
      <Route
        path="/events/:id"
        element={loggedIn ? <AppShell><EventDetail /></AppShell> : <Navigate to="/" replace />}
      />
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
          ) : (
            <Navigate to={loggedIn ? "/events" : "/"} replace />
          )
        }
      />
      <Route
        path="/organizer/events"
        element={
          loggedIn && isOrganizer ? (
            <AppShell><ManageEvents /></AppShell>
          ) : (
            <Navigate to={loggedIn ? "/events" : "/"} replace />
          )
        }
      />
      <Route
        path="/organizer/events/:id"
        element={
          loggedIn && isOrganizer ? (
            <AppShell><RegistrantList /></AppShell>
          ) : (
            <Navigate to={loggedIn ? "/events" : "/"} replace />
          )
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          loggedIn && isAdmin ? (
            <AppShell><AdminDashboard /></AppShell>
          ) : (
            <Navigate to={loggedIn ? (isOrganizer ? "/organizer" : "/events") : "/"} replace />
          )
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
