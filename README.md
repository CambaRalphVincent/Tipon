# Tipon - University Event Registration System (ERS)

Tipon replaces manual event sign-ups (paper forms, spreadsheets, group chats) with a
web-based registration system. It prevents overbooking and duplicate registrations,
gives organizers real-time visibility into who has registered and attended their
events, and gives participants a single place to browse events, register, and track
their registration history.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 (PHP 8.2+) REST API |
| Participant pages | Laravel Livewire 4 for Browse Events and Event Detail |
| React frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 + Radix UI components |
| Database | PostgreSQL |
| Auth | Laravel Sanctum tokens, Laravel session auth for Livewire pages, role middleware |
| Charts | Recharts |
| Notifications | Laravel database notifications (in-app, polymorphic) |
| Transactional email | Brevo (HTTP API transport via `symfony/brevo-mailer`) |
| Testing | PHPUnit |

**Architecture:** mixed full-stack architecture inside one repository. The React
single-page app (`tipon-web`) handles authentication, organizer pages, admin pages,
and My Registrations. The Laravel app (`tipon-api`) provides the REST API and also
serves participant Browse Events and Event Detail pages through Livewire. Both
frontends share the same PostgreSQL-backed Laravel domain logic, validation rules,
database constraints, theme tokens, and notification system.

For a focused breakdown of React, Laravel API, and Livewire responsibilities, see
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
Tipon/
|-- tipon-api/   Laravel REST API + Livewire participant pages
`-- tipon-web/   React SPA for auth, organizer, admin, and My Registrations
```

## Roles

- **Participant** — self-registers an account (must verify their email via a
  6-digit code before they can log in), browses events, registers/cancels, views
  their own registration history, receives notifications.
- **Organizer** — provisioned by an admin (does not self-register). Creates, edits,
  and cancels their own events, views/manages registrants, records attendance, and
  has a dashboard with registration/attendance stats.
- **Admin** — seeded account. Lists all participants/organizers, creates new
  organizer accounts, and can promote a participant to organizer.

## Core Workflows

1. **Registration, Email Verification & Login** — participants self-register with
   a password that must be at least 8 characters with an uppercase letter, a
   lowercase letter, a number, and a symbol (enforced server-side; the frontend
   shows a live strength checklist and a live password-match check while typing).
   The account starts unverified and a 6-digit code is emailed via Brevo. Login is
   blocked (`403`) until that code is confirmed via `/email/verify`, which then
   issues the Sanctum token used for all subsequent requests. Admin-created
   organizer accounts follow the same email verification and password policy:
   they sign in with the admin-set password, enter the emailed OTP, and only then
   receive access. Promoted organizers keep their existing verified participant account.
   Login distinguishes an unregistered email (`404`, with a prompt to create an
   account) from a wrong password for an existing email (`401 Invalid credentials`),
   so new users are not left guessing what went wrong.
2. **Event Management** — organizers create/edit/cancel events (title, description,
   venue, date, capacity, optional cover image). Title is capped at **100
   characters** and description at **1000 characters**, both enforced server-side
   and mirrored in the UI with `maxLength` inputs and live `X/limit` counters. An
   organizer cannot have two active (`open`)
   events with the same title (case-insensitive) — enforced both server-side (a
   partial unique DB index, same pattern as duplicate-registration prevention) and
   live in the UI as the title is typed. Cancelling an event frees its title for
   reuse. Cover image uploads are limited to **JPG, PNG, or WEBP, max 2 MB**,
   enforced server-side (`UploadController`) so the limit can't be bypassed by the
   client.
3. **Event Registration with Capacity Check** — the most critical workflow: on
   registration, the event row is locked (`lockForUpdate`) inside a DB transaction,
   the app checks the event is open, checks for an existing active registration
   (also enforced by a partial unique DB index), checks free capacity, then creates
   the registration and fires an in-app notification. This prevents overbooking under
   concurrent requests.
4. **Attendance Recording** — organizers mark each registrant `present` / `absent`
   (default `pending`) from the registrant list; this updates the shared app state so
   dashboard stats stay in sync immediately.
5. **Dashboards & Notifications** — organizer dashboard shows registration counts,
   capacity usage, and attendance rate per event; participants and organizers receive
   in-app notifications on registration/event changes.

## Design

- **Brand mark** — the Tipon logo started as a raster PNG doodle (hand-drawn
  celebration illustration) displayed via a CSS `invert()`/`contrast()` filter hack
  to fake a transparent background. It's now a real vector: the source PNG was
  binarized and traced with `potrace`, then optimized with `svgo` (67 KB → 27.5 KB).
  The result is `tipon-web/src/app/components/TiponLogoIcon.tsx` (inline SVG,
  `fill="currentColor"` so it inherits whatever text color is set on it) and its
  Blade equivalent, `tipon-api/resources/views/partials/tipon-logo-icon.blade.php`
  (same path data, reused by the Livewire sidebar). Both render crisp at any size
  with a genuinely transparent background — no more boxed-in look, no CSS filter.
- **Auth page** — `AuthPage.tsx` is a full-height split-screen layout (brand panel
  58% / form panel 42%) instead of a centered card, so the page uses the full
  viewport instead of leaving large empty margins. The brand panel has a diagonal
  gradient, a soft radial glow, and a faint dot-grid texture, all built from the
  existing theme's CSS custom properties (`--background`, `--primary`,
  `--foreground`, etc.) rather than fixed colors, so it still responds correctly
  to the theme switcher (gold/teal/sunset). Headings use a second display
  typeface, "Bricolage Grotesque" (loaded in `src/styles/fonts.css` alongside
  Plus Jakarta Sans), for contrast against body text. Password fields across
  login and registration got a show/hide toggle. A compact logo now also appears
  on mobile, where the brand panel is hidden — previously mobile visitors saw no
  branding on this screen at all. The sign-in flow also surfaces the API's
  missing-account response when an email is not registered, instead of showing
  the same invalid-credentials message used for wrong passwords.
- **Dashboards & lists** — the rounded-2xl / hover-lift card language and pill-style
  buttons introduced above were extended to the rest of the authenticated app:
  `AdminDashboard.tsx` (search bar with icon, `CountPill` chips for
  Participants/Organizers/Showing counts, restyled user table), `ManageEvents.tsx`
  and `OrganizerDashboard.tsx` (empty states with a call-to-action when an organizer
  has no events yet, instead of a bare empty table/chart area), and
  `MyRegistrations.tsx` (registration list rebuilt as a card grid matching the
  Browse Events cards, with a `CapacityBar` and a pill "View details" button, instead
  of the previous single-column list).

## Database Schema

- **users** — id, name, email (unique), password (bcrypt), role
  (`participant` \| `organizer` \| `admin`), email_verified_at, email_verification_code
  (hashed, nullable), email_verification_code_expires_at (nullable), timestamps.
- **events** — id, organizer_id (FK → users), title (max 100 chars), description
  (max 1000 chars, nullable), venue, event_date, capacity (int > 0),
  cover_image_path (nullable), status (`open` \| `cancelled`), timestamps. A
  partial unique index on
  `(organizer_id, LOWER(title)) WHERE status = 'open'` blocks an organizer from
  having two active events with the same title.
- **registrations** — id, event_id (FK), user_id (FK), status
  (`registered` \| `cancelled`), attendance (`pending` \| `present` \| `absent`,
  default `pending`), timestamps. A partial unique index on
  `(event_id, user_id) WHERE status = 'registered'` blocks duplicate active
  registrations at the database level.
- **notifications** — Laravel's standard polymorphic table: id (uuid), type,
  notifiable_type + notifiable_id, data (json payload), read_at, timestamps.

Event capacity/fill count is always derived live (count of active registrations),
never stored as a separate counter.

## Getting Started

### Backend (`tipon-api`)

```bash
cd tipon-api
composer install
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set:
```
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=tipon
DB_USERNAME=postgres
DB_PASSWORD=your_password
APP_URL=http://localhost:8000
```

For email verification codes to actually send, configure Brevo (or leave
`MAIL_MAILER=log` to just write emails to `storage/logs/laravel.log` instead of
sending them for real):
```
MAIL_MAILER=brevo
MAIL_FROM_ADDRESS="your-verified-brevo-sender@example.com"
MAIL_FROM_NAME="${APP_NAME}"
BREVO_API_KEY=xkeysib-your-brevo-api-key
```
Sending goes over Brevo's HTTPS API rather than SMTP — this matters on networks
(including many residential ISPs) that block outbound SMTP ports (587/465/2525).

```bash
composer require symfony/brevo-mailer symfony/http-client
php artisan migrate --seed
php artisan storage:link
composer run dev
```

`composer run dev` runs the API server, queue listener, log tailer (Pail), and Vite
dev server together. To run just the API: `php artisan serve`. On Windows, use
`composer run dev:win` instead — the same setup minus the Pail log tailer.

Seeded admin login: `admin@tipon.com` / `password`.

### Frontend (`tipon-web`)

```bash
cd tipon-web
npm install
npm run dev
```

The SPA expects the API at the URL configured in `src/app/lib/api.ts` (defaults to
`http://localhost:8000/api`).

## API Overview

All routes are under `/api` and (except register/login) require a Sanctum bearer
token.

| Area | Routes |
|---|---|
| Auth | `POST /register`, `POST /login`, `POST /logout`, `GET /me`, `POST /email/verify`, `POST /email/resend` *(rate-limited 3/min)* |
| Events | `GET /events`, `GET /events/{id}`, `POST /events` *(organizer)*, `PUT /events/{id}` *(organizer)*, `DELETE /events/{id}` *(organizer)* |
| Registrations | `GET /my-registrations` *(participant)*, `POST /events/{id}/registrations` *(participant)*, `DELETE /registrations/{id}` *(participant)*, `GET /events/{id}/registrations` *(organizer)*, `GET /organizer/registrations` *(organizer)* |
| Attendance | `PUT /registrations/{id}/attendance` *(organizer)* |
| Uploads | `POST /upload` *(organizer, cover images — JPG/PNG/WEBP only, max 2 MB)* |
| Notifications | `GET /notifications`, `PUT /notifications/{id}/read` |
| Admin | `GET /admin/users`, `POST /admin/organizers`, `PUT /admin/users/{id}/promote` |

## Livewire Web Routes

These routes are session-authenticated browser routes, not JSON API routes.

| Area | Routes |
|---|---|
| Participant events | `GET /events`, `GET /events/{event}` |
| Participant registration | `POST /events/{event}/register`, `POST /events/{event}/cancel-registration` |
| Notifications | `POST /notifications/{notification}/read`, `POST /notifications/read-all` |
| Session logout | `POST /logout-livewire` |

## Livewire Participant Pages

Tipon now uses Livewire for the participant-facing Browse Events and Event Detail
pages. This is no longer documented as a separate branch experiment; it is part of
the current working application.

### Current Livewire structure

The Livewire implementation follows a controller-wrapper structure:

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

This keeps route/page ownership in the controller while keeping interactive page
state in Livewire classes under `app/Livewire`.

### Livewire behavior

- Browse Events reads events directly from Eloquent and supports server-rendered
  search through `GET /events?q=...`, so search still works even if Livewire
  JavaScript does not hydrate.
- Event Detail uses standard form POST fallbacks for registration and cancellation:
  `POST /events/{event}/register` and
  `POST /events/{event}/cancel-registration`.
- Registration still uses the same transaction-safe capacity checks as the API:
  the event row is locked before checking capacity and creating the registration.
- The Livewire layout mirrors the React app's sidebar, notification popover,
  theme switcher, and card styling conventions.
- Theme selection is shared across React and Livewire through the same
  `tipon-theme` localStorage key and the same three options:
  `Bayanihan Gold`, `Tropical Teal`, and `Festival Sunset`.
- Notifications use Laravel database notifications. Clicking one notification
  marks it as read; `Mark all read` clears the unread count.
- Event thumbnails are rendered with explicit image dimensions and lazy loading
  rules to reduce browse-page scrolling lag.

### Shared login, two auth mechanisms

The React SPA authenticates via a Sanctum bearer token (unchanged). To let the same
login also work on session-rendered Livewire pages, `AuthController::login()` and
`verifyEmail()` additionally establish a Laravel session (`Auth::guard('web')`) when
the request is browser-based (`$request->hasSession()`), while still returning a
token in the same response for a possible future non-browser client (e.g. a mobile
app). Sanctum's `statefulApi()` (`bootstrap/app.php`) lets `auth:sanctum` accept
either credential type transparently. See `config/cors.php`, `config/sanctum.php`,
and the `SANCTUM_STATEFUL_DOMAINS`/`SESSION_DOMAIN` entries in `.env.example` for
the supporting config.

`POST /login` returns separate failure states for common credential problems:
`404` when no account exists for the submitted email, and `401` when the email
exists but the password is wrong. Unverified accounts still return `403` with
`requires_verification: true`, which drives the OTP screen.

### Local development note

Locally, the Livewire pages are reached at **`http://localhost:8000/events`**
directly, while the React app runs at **`http://localhost:5173`**. This keeps the
Laravel session and Livewire requests on the Laravel origin. In production, both
frontends should sit behind one domain/reverse proxy.

### React vs. Livewire - what building both showed

| | React SPA (`tipon-web`) | Livewire participant pages |
|---|---|---|
| **Where state lives** | Client-side, in the browser (`AppStore.tsx` context) | Server-side, re-rendered per request; the browser only holds a serialized snapshot |
| **How it talks to the backend** | Explicit REST API calls (`axios`) to `tipon-api` | Direct Eloquent queries and form POST routes inside Laravel |
| **Adding this feature from scratch** | Requires a UI layer and API endpoints, kept in sync manually | Faster for server-rendered participant pages, but requires careful layout parity |
| **Matching an existing design system** | Radix UI + Tailwind components are already available | Manual Blade/Tailwind recreation of React conventions |
| **Auth model** | Sanctum bearer tokens | Laravel browser session |
| **Cross-origin tolerance** | Designed for it from day one (that's the whole point of a decoupled API) | Assumes same-origin everywhere; breaks in ways that are hard to fully work around once that assumption doesn't hold |
| **Best fit** | An app that needs a real decoupled client (this SPA today, potentially a mobile app later) talking to one API | A Laravel-only monolith where the backend and the only frontend are never meant to be separate things |

**Takeaway:** Tipon currently demonstrates both approaches. React remains the main
client for the richer organizer/admin workflows, while Livewire is used for the
participant event-browsing flow where Laravel-owned server rendering is acceptable
and matches the supervisor's requested structure.

## Non-Functional Notes

- Passwords hashed with bcrypt; input validated server-side against SQL
  injection/XSS.
- Password strength enforced server-side via Laravel's `Password` validation rule
  (min 8 characters, mixed case, number, symbol) on both participant registration
  and admin-created organizer accounts — not just a frontend suggestion.
- Uploaded thumbnails are stored under a randomly generated hashed filename (e.g.
  `K3sdCdxVjYN2HrDRcoHXrNDWhaIW4VdvxrUmoExG.png`), never the original filename the
  organizer's browser sent. This is `UploadController`'s call to Laravel's
  `Storage::store()` without an explicit filename, which auto-generates one.
  Prevents path traversal via a crafted filename, filename collisions between
  different organizers' uploads, and leaking whatever the original filename
  contained.
- Cover image uploads are restricted server-side to JPG/PNG/WEBP and capped at
  2 MB (`['image', 'mimes:jpg,jpeg,png,webp', 'max:2048']` in `UploadController`)
  to prevent oversized or disguised/malicious files (e.g. SVG with embedded
  scripts) from being accepted — the frontend also filters and checks before
  upload, but the server-side rule is the actual security boundary.
- The React event form optimizes selected thumbnails into a smaller WebP version
  before upload when doing so reduces the file size. The server-side upload
  validation remains the security boundary.
- Role-based access enforced via middleware on every protected route.
- Registration capacity checks are transaction-safe under concurrent load
  (row-level locking).
- Participant Browse Events search, event registration, event cancellation, and
  notification read actions have normal Laravel form/route fallbacks so the core
  participant flow still works when Livewire JavaScript hydration is unreliable.
- Responsive UI targeting Chrome, Firefox, and Edge.
- `EventController::store()`/`update()` now reload and return `registered_count`
  on the created/updated event (previously omitted, so the frontend received an
  incomplete event shape right after a create/edit). `AppStore.tsx` also added a
  runtime `isApiEvent()` guard around both calls: if a response ever doesn't match
  the expected shape, it falls back to refetching the full event list instead of
  storing malformed data.
- Defensive null-safety fixes across `AppShell.tsx`, `ManageEvents.tsx`,
  `OrganizerDashboard.tsx`, `MyRegistrations.tsx`, and `StatusBadge.tsx` so a
  momentarily-null `currentUser` (during initial auth check) or an unrecognized
  status value renders a safe fallback instead of crashing the page.
- `AppShell.tsx`'s sidebar logo/home link now routes by role (admin → `/admin`,
  organizer → `/organizer`, participant → Livewire's `/events`) — previously it
  always linked to the Livewire events page regardless of who was logged in.
- Login feedback now separates missing-account and wrong-password failures:
  `AuthController::login()` returns a `404` missing-account message for an
  unregistered email, while an existing email with the wrong password remains a
  `401 Invalid credentials` response. `AuthLoginTest` covers both branches.
