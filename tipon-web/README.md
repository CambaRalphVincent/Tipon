# Tipon Web

React, TypeScript, and Vite frontend for Tipon.

## Commands

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

`npm run test` runs Vitest and React Testing Library coverage through
`vitest.config.ts` for frontend display, routing, store/API behavior, and
component interaction logic. Current coverage includes auth forms, admin user
management, admin event monitoring, admin event details drawer behavior,
admin event-notification deep links, organizer dashboard stats, event
browsing/management, event-form validation including past-schedule blocking,
registrant lists, My Registrations tabs, attendance badges, shared components,
app-store state transitions, role navigation, route access, notification
actions, and notification action navigation.

The current frontend suite passes with **26 test files and 100 tests**.

Frontend tests are organized by feature area under:

```text
src/app/tests/
|-- AccessControl/
|   |-- RoleNavigationTest.test.ts
|   `-- RouteAccessUiTest.test.tsx
|-- Admin/
|   |-- AdminDashboardUiTest.test.tsx
|   |-- AdminEventMonitorUiTest.test.tsx
|   `-- CreateOrganizerDialogTest.test.tsx
|-- Attendance/
|   |-- AttendanceBadgeTest.test.ts
|   |-- AttendanceUiTest.test.tsx
|   `-- RegistrantListUiTest.test.tsx
|-- Auth/
|   |-- AuthUiTest.test.tsx
|   `-- LoginTest.test.ts
|-- Components/
|   |-- CapacityBarTest.test.tsx
|   `-- EventCardTest.test.tsx
|-- Events/
|   |-- EventBrowseTest.test.ts
|   |-- EventBrowseUiTest.test.tsx
|   |-- EventDateTimeTest.test.ts
|   |-- EventFormUiTest.test.tsx
|   |-- EventManagementTest.test.ts
|   `-- ManageEventsUiTest.test.tsx
|-- Notifications/
|   |-- NotificationBellUiTest.test.tsx
|   `-- NotificationTest.test.ts
|-- Organizer/
|   `-- OrganizerDashboardUiTest.test.tsx
|-- Registrations/
|   |-- MyRegistrationsTest.test.ts
|   |-- MyRegistrationsUiTest.test.tsx
|   `-- RegistrationTabTest.test.ts
`-- Store/
    |-- AppStoreEventTest.test.tsx
    `-- AppStoreRegistrationTest.test.tsx
```
