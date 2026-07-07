# Tipon Event Registration System

## SDLC Progress Documentation

## Project Background

Tipon is an Event Registration System developed as an onboarding activity to test and demonstrate full-stack development knowledge before starting the real project. The system simulates a university event registration platform with participant, organizer, and admin roles.

## Current Overall Status

Tipon is currently in **late Phase 3: Development**, with early **Phase 4: Security & Validation** already started and **Phase 5: Testing** now underway through both manual testing and automated Laravel feature tests.

Most core features are already working. Current work is focused on UI consistency across the React and Livewire areas, validation, bug fixing, performance refinement, expanding test coverage where needed, and preparing the system for final documentation or deployment review.

## Phase 1: Requirements & Mockups

**Status:** Completed

### Work Completed

- Identified the system purpose: an event registration platform.
- Defined the main user roles:
  - Participant
  - Organizer
  - Admin
- Identified the core features:
  - User registration and login
  - Email verification
  - Event browsing
  - Event registration
  - Registration cancellation
  - Organizer event management
  - Attendance tracking
  - Admin user management
- Planned the participant, organizer, and admin workflows.
- Started UI planning based on the expected user flows.

### Evidence

- Participant flow includes Browse Events, Event Details, and My Registrations.
- Organizer flow includes Dashboard, Manage Events, event creation, and registrant management.
- Admin flow includes User Management and organizer creation/promotion.

## Phase 2: System Design

**Status:** Mostly Completed

### Work Completed

- Designed the backend using Laravel.
- Designed the frontend structure using:
  - Livewire for participant event browsing and event details.
  - React for organizer/admin dashboards and registration-related views.
- Refined the Livewire structure to follow a clearer Laravel convention:
  - Routes point to `EventController` page methods.
  - Page-level Blade wrappers live in `resources/views/events`.
  - Livewire component classes live in `app/Livewire`.
  - Livewire component views live in `resources/views/livewire`.
- Designed the database structure for:
  - Users
  - Events
  - Registrations
  - Notifications
- Planned role-based access for participant, organizer, and admin users.
- Planned event capacity and registration rules.
- Planned event ownership rules for organizers.

### Evidence

- Database migrations exist for events and registrations.
- API routes are grouped by role:
  - Participant-only routes
  - Organizer-only routes
  - Admin-only routes
- Participant Livewire pages now follow the structure:
  - `/events` -> `EventController@browsePage` -> `events/browse.blade.php` -> `<livewire:event-browse />`
  - `/events/{event}` -> `EventController@detailPage` -> `events/detail.blade.php` -> `<livewire:event-detail />`
- Event registration rules include capacity limits and duplicate-registration prevention.

## Phase 3: Development

**Status:** In Progress, Late Stage

### Work Completed

- Implemented authentication and logout.
- Implemented email OTP verification.
- Implemented participant event browsing.
- Implemented participant event detail pages.
- Refactored participant Livewire pages from anonymous components into class-based Livewire components.
- Added controller-backed Blade wrappers for participant Livewire pages.
- Implemented event registration.
- Implemented registration cancellation.
- Implemented My Registrations page.
- Implemented organizer dashboard.
- Implemented Manage Events page.
- Implemented event creation, update, and cancellation.
- Implemented event thumbnail upload.
- Implemented attendance tracking.
- Implemented admin user management.
- Implemented organizer account creation.
- Added email OTP verification for admin-created organizer accounts.
- Shared the same password-strength validation rules between participant registration and admin organizer creation.
- Implemented participant promotion to organizer.
- Implemented notification support.
- Improved UI consistency between Livewire and React pages.
- Added browser-side thumbnail optimization before event image upload.
- Added fallback non-Livewire form behavior for participant search, registration, and cancellation flows.
- Added backend coverage for admin-created organizer OTP verification and promoted participant verification preservation.
- Added backend coverage for login failures, including unregistered email and wrong-password cases.
- Added categorized Laravel feature tests under `tests/Feature`, grouped by AccessControl, Admin, Api, Attendance, Auth, Database, Events, Livewire, Notifications, Registrations, Smoke, and Uploads.
- Added automated coverage for role access boundaries, login, registration, email verification, admin organizer management, event create/update/cancel, duplicate event titles, participant registration rules, attendance marking, upload validation, and notification ownership.
- Added automated coverage for completed/past event behavior, event validation rules, and Livewire participant web routes.
- Added automated coverage for email verification resend behavior, notification payload/order, and upload edge cases such as required file, oversized file, rejected PDF/GIF/SVG, accepted PNG/JPG/JPEG, and generated storage filenames.
- Added automated coverage for API response shapes, database-level constraints, and admin validation rules.
- Added automated coverage for API/logout session behavior, registration edge cases, and organizer registrant-list ownership.
- Added automated coverage for registration and cancellation resilience when notification delivery fails after the database update.
- Added automated coverage for auth normalization, duplicate participant email rejection, event update edge cases, venue/status validation, and individual Livewire notification read ownership.
- Added automated coverage for rejecting already-cancelled registration cancellation and preventing event capacity from being reduced below active registration count.
- Added automated coverage for organizer event-cancellation side effects: active registrations are cancelled and active registrants receive notifications.
- Added automated coverage for participant re-registration display behavior: old cancelled rows are hidden from My Registrations when the participant is currently registered again for the same event.
- Added automated coverage for Cancelled tab cleanup: only the latest recent cancellation per event is shown, and cancelled entries are hidden after one day.
- Added frontend Vitest coverage for My Registrations display rules and tab summary text.
- Expanded frontend Vitest coverage for Admin Dashboard, Create Organizer dialog,
  Organizer Dashboard, Manage Events, Registrant List, AppStore registration/event
  state behavior, CapacityBar, and EventCard.
- Added a dedicated `vitest.config.ts` test config so frontend unit tests run
  without loading the Tailwind Vite native plugin.
- Fixed frontend production build issues caused by missing UI dependencies and stale generated component typings.
- Added `docs/AUTOMATED_TESTING.md` to document the test folder structure, commands, covered cases, and Laravel testing tools used.

### Recent Progress

- Improved sidebar consistency across participant and React pages.
- Improved empty states for Browse Events, My Registrations, Organizer Dashboard, and Manage Events.
- Polished registration confirmation dialogs.
- Fixed blank page issue after event creation.
- Improved Manage Events table behavior for long titles.
- Improved admin user management layout and organizer creation validation.
- Improved admin-created organizer login guidance on the sign-in page.
- Improved participant event detail layout.
- Improved My Registrations card button hover states.
- Improved My Registrations loading and empty-state messaging so tab changes and sign-out do not show misleading copy.
- Added branded app initialization and redirect loading states.
- Cleaned up test events to prepare for formal sample data.
- Reorganized participant Livewire files to match the expected `app/Livewire` and `resources/views/livewire` structure.
- Updated `/events` and `/events/{event}` so the page flow is now `EventController -> Blade wrapper -> Livewire component`.
- Improved Browse Events performance by optimizing uploaded thumbnails and reducing expensive card/image effects.
- Fixed Browse Events search by supporting a normal `GET /events?q=...` fallback.
- Fixed participant event registration by using normal POST form fallbacks for registration and cancellation.
- Replaced the browser confirmation prompt with a styled centered confirmation dialog for event registration.
- Improved notification behavior on Livewire pages:
  - Clicking one notification marks only that notification as read.
  - Mark all read remains available.
  - Notification rows now follow the React convention with status-based titles and success/cancel icons.
- Fixed notification popover overflow on React pages.
- Matched the Livewire theme switcher visually and behaviorally with the React theme switcher.
- Standardized the theme storage key across React and Livewire as `tipon-theme`.
- Added the same theme options across both stacks:
  - Bayanihan Gold
  - Tropical Teal
  - Festival Sunset
- Improved My Registrations card readability by making registration status badges high-contrast over thumbnails.
- Fixed mojibake text issues in participant-facing Blade views.
- Improved sign-in feedback so an unregistered email shows a missing-account message instead of the generic invalid-credentials response.

### Current Development Focus

- UI polish and layout consistency.
- Edge-case handling.
- Better empty states.
- Better feedback for user actions.
- Cross-stack consistency between React pages and Livewire pages.
- Browse Events performance and interaction reliability.
- Preparing the application for validation and testing.

## Phase 4: Security & Validation

**Status:** Started

### Validations Already Applied

#### Authentication Validation

- Name is required, must be a string, and has a maximum length.
- Email is required, must be valid, and must be unique.
- Email addresses are normalized before authentication and account creation.
- Password is required.
- Participant password confirmation is required.
- Admin organizer password confirmation is required.
- Password must be at least 8 characters.
- Password must include mixed case, numbers, and symbols.
- Login requires valid email and password fields.
- Login distinguishes missing accounts from wrong passwords: unregistered email returns `404`, while an existing email with the wrong password returns `401`.
- Email verification requires a valid email and a 6-character code.
- Verification code must match the stored hashed code.
- Verification code must not be expired.

#### Event Validation

- Event title is required.
- Event title has a maximum length of 100 characters.
- Event description is optional but has a maximum length of 1000 characters.
- Venue is required.
- Venue has a maximum length.
- Event date is required.
- Event date must be a valid date.
- Event date must be after the current time.
- Capacity is required.
- Capacity must be an integer.
- Capacity must be at least 1.
- Event status must be one of `open`, `cancelled`, or `completed`.
- Cover image path is optional and has a maximum length.

#### Upload Validation

- Uploaded file is required.
- Uploaded file must be a valid image.
- Allowed image formats are JPG, JPEG, PNG, and WEBP.
- Maximum upload size is 2 MB.

#### Attendance Validation

- Attendance value is required.
- Attendance must be one of:
  - `pending`
  - `present`
  - `absent`

### Business Rule Validation

- Participants cannot register for cancelled or non-open events.
- Participants cannot register twice for the same active event.
- Event capacity cannot be exceeded.
- Event capacity cannot be reduced below the current active registration count.
- Registration uses database locking to prevent concurrent overbooking.
- Participants can only cancel their own registrations.
- Participants cannot cancel a registration that is already cancelled.
- Organizers can only update or cancel their own events.
- Cancelling an event cancels its active registrations and notifies the affected active registrants.
- Organizers can only mark attendance for registrations under their own events.
- Organizers cannot create two active events with the same title.
- Cancelled event titles can be reused.
- Admin can only promote users who are currently participants.

### Database-Level Constraints

- Event status is limited to `open`, `cancelled`, or `completed`.
- Registration status is limited to `registered` or `cancelled`.
- Attendance status is limited to `pending`, `present`, or `absent`.
- Events must belong to an existing organizer.
- Registrations must belong to an existing event and user.
- One participant can only have one active registration per event.
- One organizer can only have one active event with the same title, case-insensitive.

### Frontend Guards

- Event title has a 100-character limit.
- Event description has a 1000-character limit.
- Required event fields must be filled before submit.
- Capacity must be greater than 0.
- Duplicate active event titles are detected before submit.
- Image upload only accepts JPG, PNG, and WEBP files.
- Image upload is limited to 2 MB.
- Submit is disabled while image upload is still running.
- Event thumbnails are optimized to a smaller WebP version before upload when possible.
- Participant event search supports a server-rendered fallback through query parameters.
- Participant registration and cancellation support normal form POST fallbacks.
- Notification popovers are constrained to prevent overflow on long notification lists.
- Theme selection persists through local storage and is shared by React and Livewire pages.
- Participant registration and admin organizer creation use the same frontend password checklist.
- My Registrations uses tab-specific empty states instead of a generic loading message.
- App-level loading screens use neutral workspace copy during initialization and redirects.

## Phase 5: Testing & CI/CD

**Status:** Started, Automated Backend and Frontend Tests Added

### Manual Testing Already Done

- Tested login and logout flows.
- Tested participant browsing.
- Tested event registration.
- Tested registration cancellation.
- Tested organizer event creation.
- Tested organizer event cancellation.
- Tested admin user management.
- Tested empty states.
- Tested UI behavior with long event titles.
- Tested role-based navigation behavior.
- Tested Browse Events search behavior after adding the query parameter fallback.
- Tested participant event registration after replacing broken Livewire-only actions with form fallbacks.
- Tested notification read behavior for individual notifications and mark-all-read.
- Tested theme switching across React and Livewire pages.
- Tested notification popover overflow behavior on React pages.
- Tested Browse Events scrolling after thumbnail optimization.
- Tested My Registrations card readability with bright event thumbnails.
- Tested admin-created organizer first-login OTP behavior.
- Tested that promoted participants keep their verified account state.
- Tested login response behavior for unregistered emails and wrong passwords.

### Automated Backend Testing Added

The Laravel backend now includes categorized PHPUnit feature tests under
`tipon-api/tests/Feature`. The test suite is organized by system area:

- `AccessControl/AccessControlTest.php`
- `Admin/OrganizerAccountTest.php`
- `Api/ResponseShapeTest.php`
- `Attendance/AttendanceTest.php`
- `Auth/LoginTest.php`
- `Auth/RegisterTest.php`
- `Auth/EmailVerificationTest.php`
- `Auth/LogoutTest.php`
- `Database/ConstraintTest.php`
- `Events/ManagementTest.php`
- `Events/CompletionTest.php`
- `Events/ValidationTest.php`
- `Livewire/ParticipantEventRoutesTest.php`
- `Notifications/NotificationTest.php`
- `Registrations/OrganizerRegistrationListTest.php`
- `Registrations/RegistrationTest.php`
- `Smoke/HomePageTest.php`
- `Uploads/CoverImageUploadTest.php`

Current automated coverage includes:

- Authentication success and failure states, including email normalization and duplicate participant email rejection.
- API bearer-token logout and Livewire session logout behavior.
- Participant registration, email verification, invalid/expired OTP handling, and verification-code resend behavior.
- Admin organizer creation, participant promotion, admin validation rules, duplicate email rejection, password strength, and invalid promotion attempts.
- API response shapes used by the frontend, including event counts, organizer data, nested registration event data, and admin user fields.
- Database-level constraints for duplicate registrations, duplicate open event titles, reusable cancelled states, and foreign key integrity.
- Role-based access control across participant, organizer, admin, and shared API routes.
- Organizer event create, update, cancel, ownership checks, duplicate-title prevention, duplicate-title blocking during update, status cancellation through update, blocked capacity reduction below active registrations, and event-cancellation side effects.
- Event schedule handling, including preserving Philippines-local event times and converting legacy UTC-style payloads back to Philippines-local time.
- Event validation, including required title, title/description/venue length limits, future dates, minimum capacity, invalid update status rejection, and title reuse after cancellation.
- Completed/past event behavior, including automatic completion, blocked late registration, blocked late cancellation, and blocked organizer edits/cancellations.
- Participant event registration, capacity blocking, duplicate-registration prevention, cancellation ownership, already-cancelled cancellation blocking, cancelled-event blocking, re-registration after cancellation, cancelled registrations not counting toward capacity, cancelled registration history, hiding superseded cancelled history when the participant is currently registered again for the same event, showing only the latest recent cancellation per event, and hiding cancelled entries after one day.
- Organizer registrant-list behavior, including active-only event registrant lists, user details, same-role ownership protection, organizer-only event scoping, and cancelled registration history.
- Livewire participant Browse Events and Event Detail pages, search fallback, form-based registration/cancellation, notification read-all behavior, individual notification read behavior, and notification ownership.
- Attendance marking and attendance validation.
- Cover image upload access, file validation, size validation, accepted/rejected file types, and generated storage filenames.
- Notification listing, read state, ownership protection, payload content, cancellation notifications, newest-first ordering, and notification-delivery failure resilience.

Current passing result:

```text
114 tests passed, 440 assertions
```

The testing guide is documented in `docs/AUTOMATED_TESTING.md`.

Frontend verification now includes:

```text
npm run test
npm run lint
npm run build
```

The React frontend now includes categorized Vitest and React Testing Library tests
under `tipon-web/src/app/tests`, covering AccessControl, Admin, Attendance, Auth,
Components, Events, Notifications, Organizer, Registrations, and Store behavior.
Current frontend coverage includes admin user management, organizer dashboard
totals, manage-events filtering/actions, registrant lists, AppStore state changes,
shared component states, auth, route access, notifications, event browsing, event
forms, attendance badges, and My Registrations.

Current passing frontend result:

```text
25 test files passed, 88 tests passed
```

### Still Needed

- Configure a basic CI/CD pipeline.
- Prepare final deployment steps.
- Prepare final project documentation and presentation.

## Summary

Tipon has completed the requirements and system design phases and is currently in the late development phase. The system already includes working participant, organizer, and admin workflows. Validation and security work has started through request validation, role-based access control, ownership checks, upload restrictions, and database constraints.

Recent work focused on making the mixed React and Livewire frontend feel like one coherent application and adding automated Laravel and frontend tests for critical workflows. The Browse Events page now has more reliable search, registration, cancellation, notification, and theme-setting behavior. The React and Livewire notification and theme controls are being aligned to one convention, while thumbnail optimization and UI fixes have improved performance and readability.

The next major milestone is to configure a basic CI/CD pipeline and prepare the project for final review or deployment.
