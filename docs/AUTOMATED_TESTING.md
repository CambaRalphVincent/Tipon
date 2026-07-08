# Automated Testing

This document explains the automated Laravel and React frontend tests added for
Tipon, how they are organized, and how to run them.

## Purpose

Automated testing helps confirm that Tipon's important backend rules and frontend
workflows still work after code changes. Instead of manually testing every
workflow in the browser, the Laravel and React test suites can quickly report
whether a feature broke.

For Tipon, the tests verify rules such as:

- Only the correct role can access protected routes.
- Participants can register for valid events.
- Participants cannot register twice for the same active event.
- Full events reject new registrations.
- Organizers can only manage their own events.
- Admin-only routes are blocked from participants and organizers.
- Upload validation rejects invalid files.
- Notifications can only be read by their owner.

## Test Folder Structure

Feature tests are organized by system area under:

```text
tipon-api/tests/Feature
```

Current structure:

```text
tests/Feature/
|-- AccessControl/
|   `-- AccessControlTest.php
|-- Admin/
|   `-- OrganizerAccountTest.php
|-- Api/
|   `-- ResponseShapeTest.php
|-- Attendance/
|   `-- AttendanceTest.php
|-- Auth/
|   |-- EmailVerificationTest.php
|   |-- LoginTest.php
|   |-- LogoutTest.php
|   `-- RegisterTest.php
|-- Database/
|   `-- ConstraintTest.php
|-- Events/
|   |-- CompletionTest.php
|   |-- ManagementTest.php
|   `-- ValidationTest.php
|-- Livewire/
|   `-- ParticipantEventRoutesTest.php
|-- Notifications/
|   `-- NotificationTest.php
|-- Registrations/
|   |-- OrganizerRegistrationListTest.php
|   `-- RegistrationTest.php
|-- Smoke/
|   `-- HomePageTest.php
`-- Uploads/
    `-- CoverImageUploadTest.php
```

## Naming Pattern

Each test file contains one test class. Each `test_...` method is one test case.

Example:

```php
namespace Tests\Feature\Auth;

class LoginTest extends TestCase
{
    public function test_verified_user_can_login_and_receive_token(): void
    {
        // Test steps and assertions.
    }
}
```

In this example:

- `Auth/` is the category folder.
- `LoginTest.php` is the test file.
- `LoginTest` is the test class.
- `test_verified_user_can_login_and_receive_token()` is one test case.

## Test Categories

### Access Control

File:

```text
tests/Feature/AccessControl/AccessControlTest.php
```

Checks route-level permissions:

- Protected API routes require authentication.
- Shared authenticated routes allow participant, organizer, and admin.
- Participant-only routes reject organizer and admin.
- Organizer-only routes reject participant and admin.
- Admin-only routes reject participant and organizer.

This test focuses on role boundaries, not detailed business rules.

### Authentication

Files:

```text
tests/Feature/Auth/LoginTest.php
tests/Feature/Auth/RegisterTest.php
tests/Feature/Auth/EmailVerificationTest.php
tests/Feature/Auth/LogoutTest.php
```

Checks login, registration, and email verification behavior:

- Verified users can log in.
- Missing accounts return a helpful message.
- Wrong passwords are rejected.
- Unverified users cannot log in yet.
- Login normalizes uppercase/spaced email input before authentication.
- Participant registration creates an unverified account.
- Participant registration trims names and normalizes email addresses.
- Duplicate participant emails are rejected after normalization.
- Weak or unconfirmed passwords are rejected.
- Valid OTP codes verify users.
- Expired OTP codes are rejected.
- Invalid OTP codes are rejected.
- OTP codes must be exactly 6 characters.
- Verification-code resend fails for unknown or already verified emails.
- Verification-code resend creates a new code for unverified users.
- Verification-code resend is rate-limited.
- `/api/me` works with a bearer token.
- API logout revokes bearer tokens.
- Livewire logout clears the browser session and redirects to the React frontend.

### Admin

File:

```text
tests/Feature/Admin/OrganizerAccountTest.php
```

Checks admin-specific account actions:

- Admin can create organizer accounts.
- Admin-created organizers must verify email before login.
- Participants cannot create organizer accounts.
- Admin can promote participants to organizers.
- Promoted participants keep their verified email state.
- Admin-created organizer passwords must be strong.
- Duplicate organizer emails are rejected.
- Admin-created organizer names and emails are normalized.
- Admin cannot promote organizers or other admins.

### API Response Shapes

File:

```text
tests/Feature/Api/ResponseShapeTest.php
```

Checks API response contracts used by the frontend:

- Event list responses include `registered_count`.
- Event detail responses include organizer data and `registered_count`.
- Event create/update responses include `registered_count`.
- Registration creation response includes nested event ID and title.
- Admin users response excludes admin accounts and sensitive fields.

### Database Constraints

File:

```text
tests/Feature/Database/ConstraintTest.php
```

Checks database-level integrity rules:

- Duplicate active registrations are blocked by the database.
- Cancelled registrations allow re-registration.
- Duplicate open event titles are blocked case-insensitively per organizer.
- Cancelled event titles can be reused.
- Events must belong to an existing organizer.
- Registrations must belong to an existing event and user.

### Events

File:

```text
tests/Feature/Events/ManagementTest.php
```

Checks organizer event management:

- Organizer can create an event.
- Participant cannot create an event.
- Organizer can update their own event.
- Organizer cannot update an event to duplicate another open event title.
- Organizer can update an event status to cancelled.
- Organizer cannot reduce capacity below the current number of active registrations.
- Organizer cannot update another organizer's event.
- Organizer can cancel their own event.
- Event cancellation cancels active registrations and notifies active registrants.
- Duplicate open event titles are rejected case-insensitively.
- Event creation preserves Philippines-local event time values.
- Legacy UTC-style event date payloads are converted back to Philippines-local time.

Additional event files:

```text
tests/Feature/Events/CompletionTest.php
tests/Feature/Events/ValidationTest.php
```

These check:

- Past open events are marked as completed.
- Participants cannot register for completed or past events.
- Participants cannot cancel after the event date.
- Organizers cannot edit or cancel completed events.
- Required event fields are validated.
- Long titles, descriptions, and venues are rejected.
- Past event dates are rejected and do not create event rows.
- Capacity must be at least 1.
- Invalid update statuses are rejected.
- Cancelled event titles can be reused.

### Livewire Participant Routes

File:

```text
tests/Feature/Livewire/ParticipantEventRoutesTest.php
```

Checks participant browser-session routes:

- Participant can view the Livewire Browse Events page.
- Participant can view the Livewire Event Detail page.
- Organizer and admin cannot access participant Livewire pages.
- `GET /events?q=...` filters event results by title and venue.
- Browse Events search is case-insensitive for title and venue queries.
- Participant can register through `POST /events/{event}/register`.
- Participant can cancel through `POST /events/{event}/cancel-registration`.
- Participant can mark all Livewire notifications as read.
- Participant can mark one Livewire notification as read.
- Participant cannot mark another user's Livewire notification as read.

### Registrations

File:

```text
tests/Feature/Registrations/RegistrationTest.php
```

Checks participant registration behavior:

- Participant can register for an open event.
- Organizer cannot register as a participant.
- Participant cannot register twice for the same active event.
- Participant cannot register when an event is full.
- Participant cannot register for a cancelled event.
- Participant can re-register after cancelling when capacity is available.
- Cancelled registrations do not count toward capacity.
- Participant can cancel their own registration.
- Participant cannot cancel another participant's registration.
- Participant cannot cancel a registration that is already cancelled.
- My Registrations includes cancelled history.
- My Registrations hides old cancelled history for an event when the participant is currently registered again for that same event.
- My Registrations only shows the latest recent cancelled registration per event.
- My Registrations hides cancelled registrations after one day.

Additional registration file:

```text
tests/Feature/Registrations/OrganizerRegistrationListTest.php
```

Checks organizer registration-list behavior:

- Event registrant list returns only active registered users.
- Event registrant list includes user name and email.
- Organizer cannot view registrants for another organizer's event.
- Organizer all-registrations endpoint only returns their events.
- Organizer all-registrations endpoint keeps cancelled registration history.

### Attendance

File:

```text
tests/Feature/Attendance/AttendanceTest.php
```

Checks organizer attendance tracking:

- Event owner can mark attendance.
- Different organizer cannot mark attendance for someone else's event.
- Invalid attendance values are rejected.

### Uploads

File:

```text
tests/Feature/Uploads/CoverImageUploadTest.php
```

Checks cover image upload validation:

- Organizer can upload a valid cover image.
- Upload requires a file.
- Files larger than 2 MB are rejected.
- PNG, JPG, and JPEG image uploads are accepted.
- Participant cannot upload a cover image.
- SVG, PDF, and GIF files are rejected.
- Stored upload URLs use Laravel's generated storage filename instead of the original filename.

### Notifications

File:

```text
tests/Feature/Notifications/NotificationTest.php
```

Checks notification ownership:

- User can list their own notifications.
- User can mark their own notification as read.
- User cannot mark another user's notification as read.
- Registration notification payload includes the expected event ID, event title, status, and message.
- Cancellation creates a cancellation notification.
- Registration still succeeds if notification delivery fails after the database write.
- Cancellation still succeeds if notification delivery fails after the status update.
- Notification lists only include the current user's notifications.
- Notifications are returned newest-first.

### Smoke

File:

```text
tests/Feature/Smoke/HomePageTest.php
```

Checks that the basic home page responds successfully.

## How To Run Tests

Open a terminal in the Laravel backend folder:

```bash
cd C:\src\Tipon\tipon-api
```

Run all tests:

```bash
php artisan test
```

Stop on the first failure:

```bash
php artisan test --stop-on-failure
```

Run only feature tests:

```bash
php artisan test --testsuite=Feature
```

Run one test file:

```bash
php artisan test tests/Feature/Auth/LoginTest.php
```

Run one test method:

```bash
php artisan test --filter=test_verified_user_can_login_and_receive_token
```

## Laravel Testing Tools Used

### `RefreshDatabase`

Resets the database for each test so tests do not affect one another.

```php
use Illuminate\Foundation\Testing\RefreshDatabase;

class LoginTest extends TestCase
{
    use RefreshDatabase;
}
```

### Factories

Creates test records quickly.

```php
$participant = User::factory()->create(['role' => 'participant']);
```

### `Sanctum::actingAs()`

Simulates an authenticated API user.

```php
Sanctum::actingAs($participant);
```

### JSON Request Helpers

Used to call API routes from tests.

```php
$this->getJson('/api/events');
$this->postJson('/api/events', $data);
$this->putJson("/api/events/{$event->id}", $data);
$this->deleteJson("/api/events/{$event->id}");
```

### Response Assertions

Used to check HTTP responses.

```php
$response->assertOk();
$response->assertCreated();
$response->assertForbidden();
$response->assertUnauthorized();
$response->assertUnprocessable();
$response->assertJsonPath('message', 'Event cancelled.');
```

### Database Assertions

Used to check if records were created, updated, or blocked.

```php
$this->assertDatabaseHas('registrations', [
    'event_id' => $event->id,
    'user_id' => $participant->id,
]);

$this->assertDatabaseMissing('events', [
    'title' => 'Unauthorized Event',
]);
```

### `Storage::fake()`

Used to test file uploads without writing to the real public storage disk.

```php
Storage::fake('public');
```

## Current Result

The current backend test suite passes:

```text
116 passed, 450 assertions
```

Command used:

```bash
php artisan test --stop-on-failure
```

The React frontend includes Vitest and React Testing Library coverage for
frontend display, routing, store/API behavior, and component interaction logic:

- Auth role redirects, login form submission, registration password checklist,
  and OTP input limits.
- Admin user loading, loading/error states, search filtering, participant and
  organizer counts, participant promotion, organizer creation validation, email
  normalization, and table updates after organizer creation.
- Browse Events filtering, searching, sorting, registered/full badges, and
  duplicate title checks.
- Organizer Dashboard ownership filtering, dashboard totals, attendance-rate
  calculations, empty active-event messaging, and upcoming event ordering.
- Manage Events ownership filtering, status filters and counts, completed/cancelled
  action disabling, row navigation, and cancel confirmation behavior.
- Registrant List loading, active registrant display, cancelled-registration
  exclusion, participant details, present/absent attendance marking, and empty
  state rendering.
- Organizer event form duplicate warnings, edit prefill behavior, past-schedule
  blocking, and thumbnail file-type validation.
- My Registrations tab categorization, active-tab rendering, cancelled-history
  cleanup rules, cancellation controls, and image loading behavior.
- Attendance badge rendering, contrast classes, and Past Events-tab attendance
  display.
- AppStore registration and event state behavior, including re-registering after
  cancelled history, cancellation count updates, failed registration toasts,
  create/update/cancel event state updates, and logout state clearing.
- Shared CapacityBar and EventCard display states, including zero-capacity handling,
  full/registered/cancelled/completed states, and lazy image loading.
- Role-specific navigation items, home links, and route access decisions.
- Notification ownership filtering, unread counts, newest-first ordering,
  mark-all-read, and single-notification read actions.

Frontend tests are organized by feature area under:

```text
tipon-web/src/app/tests
```

Current frontend test structure:

```text
src/app/tests/
|-- AccessControl/
|   |-- RoleNavigationTest.test.ts
|   `-- RouteAccessUiTest.test.tsx
|-- Admin/
|   |-- AdminDashboardUiTest.test.tsx
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

Command used:

```bash
cd tipon-web
npm run test
```

`npm run test` uses `vitest.config.ts`, which keeps the test runner focused on
React/Vitest behavior and avoids loading the Tailwind Vite native plugin during
unit tests.

The current frontend suite passes with **25 test files and 90 tests**.

Frontend lint and production build also pass:

```bash
npm run lint
npm run build
```
