# Tipon Architecture

Tipon uses a mixed architecture: a Laravel backend provides the domain logic and
REST API, a React app handles most client-side dashboards and management screens,
and Laravel Livewire handles the participant event-browsing flow.

## High-Level Structure

```text
Tipon/
|-- tipon-api/
|   |-- Laravel REST API
|   |-- Laravel session-authenticated Livewire pages
|   |-- Eloquent models, validation, business rules, notifications
|
`-- tipon-web/
    |-- React + TypeScript + Vite frontend
    |-- Organizer, admin, auth, and My Registrations UI
```

Both frontends use the same Laravel backend data model and PostgreSQL database.

## Laravel API Responsibilities

The Laravel application in `tipon-api` is the source of truth for business logic.

It is responsible for:

- Authentication and email verification.
- Role-based access control for participants, organizers, and admins.
- Event creation, editing, cancellation, and listing.
- Registration creation and cancellation.
- Attendance updates.
- Admin user management.
- File upload validation and storage.
- Notification creation and read-state updates.
- Admin reminder and event-cancellation notification creation.
- Database constraints and transaction-safe capacity checks.

Important backend guarantees:

- Participants cannot register twice for the same active event.
- Event capacity cannot be exceeded.
- Organizers cannot create or update events with a past schedule.
- Registration uses row locking to prevent concurrent overbooking.
- Organizers can only manage their own events.
- Admin actions are restricted to admin users.
- Uploaded cover images are validated server-side.

## React Frontend Responsibilities

The React app in `tipon-web` is the main client-side application.

It is responsible for:

- Login, registration, and email verification UI.
- Participant My Registrations page.
- Organizer dashboard.
- Organizer Manage Events page.
- Event creation and edit dialogs.
- Attendance management UI.
- Admin User Management page.
- Admin Event Monitoring page with a row-opened event details drawer.
- Theme switching on React pages.
- React notification popover.
- Client-side form feedback and validation hints, including duplicate-title and
  past-schedule warnings for organizer event forms.

React communicates with Laravel through the REST API using `axios`.

Typical React flow:

```text
React component
  -> AppStore action
  -> axios API call
  -> Laravel API controller
  -> Eloquent/database
  -> JSON response
  -> React state update
```

React is best suited here because organizer and admin pages need richer client-side
state, dialogs, tables, dashboards, charts, and repeated UI interactions.

## Livewire Responsibilities

Livewire is used for the participant Browse Events and Event Detail pages.

Current Livewire routes:

```text
GET /events
GET /events/{event}
POST /events/{event}/register
POST /events/{event}/cancel-registration
POST /notifications/{notification}/read
POST /notifications/read-all
```

Current Livewire structure:

```text
GET /events
  -> EventController@browsePage
  -> resources/views/events/browse.blade.php
  -> <livewire:event-browse />
  -> app/Livewire/EventBrowse.php
  -> resources/views/livewire/event-browse.blade.php

GET /events/{event}
  -> EventController@detailPage
  -> resources/views/events/detail.blade.php
  -> <livewire:event-detail />
  -> app/Livewire/EventDetail.php
  -> resources/views/livewire/event-detail.blade.php
```

Livewire is responsible for:

- Server-rendered participant event browsing.
- Event detail display.
- Participant registration and cancellation through normal form POST fallbacks.
- Browse Events case-insensitive title, description, and venue search using the
  `q` query parameter.
- Participant notification display and read actions.
- Matching the React app's sidebar, theme switcher, notification popover, and card
  styling conventions.

Livewire pages query Eloquent directly instead of calling the REST API. This is
acceptable because they run inside the Laravel app.

## Authentication Model

Tipon currently supports two browser authentication paths:

- React uses Laravel Sanctum bearer tokens for API calls.
- Livewire uses Laravel session authentication for server-rendered pages.

The same login flow establishes both when the request supports a browser session.
This allows a participant to log in through the React app and then access
`http://localhost:8000/events` as a session-authenticated Livewire page.

Login responses separate the main account states so the React auth page can give
useful feedback: `404` means no account exists for the submitted email, `401`
means the email exists but the password is wrong, and `403` with
`requires_verification: true` moves the user to the OTP verification screen.

## Shared Design System Decisions

React and Livewire do not share components directly, but they share conventions.

Shared conventions include:

- Same Tipon logo and sidebar structure.
- Same dark visual language.
- Same theme options:
  - Bayanihan Gold
  - Tropical Teal
  - Festival Sunset
- Same `localStorage` key for theme persistence: `tipon-theme`.
- Same notification behavior:
  - unread badge count
  - individual notification click marks it as read
  - mark-all-read action
  - status-based titles such as `Registration confirmed`
  - notification action links route users to the relevant event, registrant list,
    organizer event inventory, or admin monitoring page
  - organizer notifications for registration activity, capacity milestones,
    upcoming-event reminders, attendance reminders, and event-cancellation summaries
  - admin notifications for new organizer-created events, unverified organizer
    accounts, and cancelled events that affected registered participants
- Similar event cards, badges, capacity bars, and empty states.

## Why Responsibilities Are Split This Way

React is used where the UI is more application-like:

- dashboards
- tables
- dialogs
- admin and organizer workflows
- client-side state management

Livewire is used where the workflow is more Laravel-owned and participant-facing:

- browse events
- view event details
- register or cancel registration

Laravel API remains the source of truth for data, validation, authorization, and
business rules.

## Local Development Ports

Typical local setup:

```text
React app:      http://localhost:5173
Laravel app:    http://localhost:8000
Livewire pages: http://localhost:8000/events
API routes:     http://localhost:8000/api/...
```

The Livewire pages are served directly from Laravel so session authentication and
server-rendered interactions stay on the Laravel origin.

## Summary

Tipon is not purely React and not purely Livewire. It is a Laravel-backed event
registration system with:

- Laravel API as the source of truth.
- React for rich dashboard and management interfaces.
- Livewire for participant event browsing and event details.

This structure lets the project demonstrate both frontend approaches while keeping
business rules centralized in Laravel.
