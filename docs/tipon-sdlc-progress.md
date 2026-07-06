# Tipon Event Registration System

## SDLC Progress Documentation

## Project Background

Tipon is an Event Registration System developed as an onboarding activity to test and demonstrate full-stack development knowledge before starting the real project. The system simulates a university event registration platform with participant, organizer, and admin roles.

## Current Overall Status

Tipon is currently in **late Phase 3: Development**, with early **Phase 4: Security & Validation** already started and selected **Phase 5: Testing** activities being done manually.

Most core features are already working. Current work is focused on UI consistency across the React and Livewire areas, validation, bug fixing, performance refinement, and preparing the system for testing and final documentation.

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
- Implemented participant promotion to organizer.
- Implemented notification support.
- Improved UI consistency between Livewire and React pages.
- Added browser-side thumbnail optimization before event image upload.
- Added fallback non-Livewire form behavior for participant search, registration, and cancellation flows.

### Recent Progress

- Improved sidebar consistency across participant and React pages.
- Improved empty states for Browse Events, My Registrations, Organizer Dashboard, and Manage Events.
- Polished registration confirmation dialogs.
- Fixed blank page issue after event creation.
- Improved Manage Events table behavior for long titles.
- Improved participant event detail layout.
- Improved My Registrations card button hover states.
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
- Password is required.
- Participant password confirmation is required.
- Password must be at least 8 characters.
- Password must include mixed case, numbers, and symbols.
- Login requires valid email and password fields.
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
- Event status must be either `open` or `cancelled`.
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
- Registration uses database locking to prevent concurrent overbooking.
- Participants can only cancel their own registrations.
- Organizers can only update or cancel their own events.
- Organizers can only mark attendance for registrations under their own events.
- Organizers cannot create two active events with the same title.
- Cancelled event titles can be reused.
- Admin can only promote users who are currently participants.

### Database-Level Constraints

- Event status is limited to `open` or `cancelled`.
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

## Phase 5: Testing & CI/CD

**Status:** Started Manually, Not Yet Automated

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

### Still Needed

- Add automated backend tests.
- Add tests for authentication.
- Add tests for email verification.
- Add tests for event creation and update.
- Add tests for event capacity limits.
- Add tests for duplicate registration prevention.
- Add tests for role-based access control.
- Add tests for attendance marking.
- Add tests for upload validation.
- Add tests for notification read and mark-all-read behavior.
- Add tests for participant search fallback behavior.
- Add tests for participant registration and cancellation form fallback behavior.
- Add frontend or component tests where practical.
- Configure a basic CI/CD pipeline.
- Prepare final deployment steps.
- Prepare final project documentation and presentation.

## Summary

Tipon has completed the requirements and system design phases and is currently in the late development phase. The system already includes working participant, organizer, and admin workflows. Validation and security work has started through request validation, role-based access control, ownership checks, upload restrictions, and database constraints.

Recent work focused on making the mixed React and Livewire frontend feel like one coherent application. The Browse Events page now has more reliable search, registration, cancellation, notification, and theme-setting behavior. The React and Livewire notification and theme controls are being aligned to one convention, while thumbnail optimization and UI fixes have improved performance and readability.

The next major milestone is to complete formal testing, add automated test coverage, and prepare the project for final review or deployment.
