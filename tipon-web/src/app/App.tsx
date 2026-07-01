import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AppShell } from "./components/AppShell";
import { AppStoreProvider } from "./store/AppStore";
import { ThemeProvider } from "./theme/ThemeProvider";
import { AuthPage } from "./pages/AuthPage";
import { EventsBrowse } from "./pages/EventsBrowse";
import { EventDetail } from "./pages/EventDetail";
import { MyRegistrations } from "./pages/MyRegistrations";
import { OrganizerDashboard } from "./pages/OrganizerDashboard";
import { ManageEvents } from "./pages/ManageEvents";
import { RegistrantList } from "./pages/RegistrantList";

export default function App() {
  return (
    <ThemeProvider>
      <AppStoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route
              path="/events"
              element={
                <AppShell>
                  <EventsBrowse />
                </AppShell>
              }
            />
            <Route
              path="/events/:id"
              element={
                <AppShell>
                  <EventDetail />
                </AppShell>
              }
            />
            <Route
              path="/my-registrations"
              element={
                <AppShell>
                  <MyRegistrations />
                </AppShell>
              }
            />
            <Route
              path="/organizer"
              element={
                <AppShell>
                  <OrganizerDashboard />
                </AppShell>
              }
            />
            <Route
              path="/organizer/events"
              element={
                <AppShell>
                  <ManageEvents />
                </AppShell>
              }
            />
            <Route
              path="/organizer/events/:id"
              element={
                <AppShell>
                  <RegistrantList />
                </AppShell>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster theme="dark" richColors position="top-right" />
      </AppStoreProvider>
    </ThemeProvider>
  );
}
