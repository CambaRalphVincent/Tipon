# Tipon — University Event Registration System (ERS)

Tipon replaces manual event sign-ups (paper forms, spreadsheets, group chats) with a
web-based registration system. It prevents overbooking and duplicate registrations,
gives organizers real-time visibility into who has registered and attended their
events, and gives participants a single place to browse events, register, and track
their registration history.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 12 (PHP 8.2+) — REST API |
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS 4 + Radix UI components |
| Database | PostgreSQL |
| Auth | Laravel Sanctum (token-based) + role middleware |
| Charts | Recharts |
| Notifications | Laravel database notifications (in-app, polymorphic) |
| Transactional email | Brevo (HTTP API transport via `symfony/brevo-mailer`) |
| Testing | PHPUnit |
| Livewire (experimental) | Livewire 4 — see [Livewire Experiment](#livewire-experiment-livewire-experiment-branch) |

**Architecture:** decoupled 3-tier — a React single-page app (`tipon-web`) talks to a
Laravel REST API (`tipon-api`) over HTTP/JSON, backed by PostgreSQL. The two apps live
in one repository but deploy and run independently. A separate `livewire-experiment`
git branch (not merged into `main`) additionally rebuilds two pages — event browsing
and event detail — as server-rendered Livewire pages, to compare the two approaches
directly (see below). `main` itself is unaffected by this experiment.

```
Tipon/
├── tipon-api/   Laravel REST API (auth, events, registrations, attendance, admin)
└── tipon-web/   React SPA (participant/organizer/admin UI)
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
   organizer accounts skip email verification — they're verified at creation since
   they don't self-register — but still go through the same password policy.
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
  branding on this screen at all.

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
dev server together. To run just the API: `php artisan serve`.

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

## Livewire Experiment (`livewire-experiment` branch)

Built to satisfy a specific requirement to demonstrate Laravel Livewire on two
pages — **Browse Events** and **Event Detail** — as a point of comparison against
the React implementation of the same features. Lives entirely on a separate git
branch, not yet merged into `main`. The Livewire-specific pieces (the two Blade
pages, session auth, routes) are isolated to this branch by design. The
vectorized logo and `AuthPage.tsx` split-screen redesign documented above under
[Design](#design) are general UI changes, not specific to this experiment — but
since they were also made on this branch, they too only exist here until
merged back.

### Running this branch locally

On top of the regular `main` setup (see Getting Started above), this branch needs:
```bash
cd tipon-api
composer require livewire/livewire   # v4 — v3 doesn't support Laravel 12
npm install                          # compiles this app's own Tailwind/JS, separate from tipon-web
npm run dev                          # third terminal, alongside `php artisan serve` and tipon-web's `npm run dev`
```
Then log in as a participant at `http://localhost:5173` as usual, and browse to
`http://localhost:8000/events` directly (see "Known limitation" below for why
that's a separate port rather than staying on `:5173`).

### What it is

- `resources/views/components/⚡events-browse.blade.php` and
  `⚡event-detail.blade.php` — Livewire 4 single-file components (PHP class +
  Blade template in one file) that re-implement `EventsBrowse.tsx`/`EventDetail.tsx`
  with live search, registration, and cancellation — but query Eloquent models
  directly instead of calling the REST API, since Livewire runs inside the same
  Laravel process.
- Routed via `Route::livewire('/events', 'events-browse')` and
  `Route::livewire('/events/{event}', 'event-detail')` in `routes/web.php`,
  guarded by `auth` + `role:participant` middleware — the same `RequireRole`
  middleware the REST API uses, since `$request->user()` resolves identically
  regardless of whether Sanctum authenticated the request via a session or a
  bearer token.
- Registration logic mirrors `RegistrationController::store()` exactly: the event
  row is locked inside a DB transaction before the capacity check, so overbooking
  can't happen even with the API and the Livewire page both live at once.
- Visually matches the React app's default "Tropical Teal" theme — the same OKLCH
  color tokens from `tipon-web/src/styles/theme.css` were copied into
  `tipon-api/resources/css/app.css`, and a left sidebar replicating `AppShell.tsx`
  (vectorized logo, nav, user info, sign out) was rebuilt in Blade/Tailwind,
  including a mobile drawer using Alpine.js (bundled with Livewire) in place of
  React state.
- Both pages went through the same visual design pass as the React app's login
  page: a pulsing "Live" badge next to the page title, a refined search bar,
  event cards with hover-lift and a pill-style "View details" button, and inline
  SVG icons (calendar, map pin, clock, etc. — path data pulled directly from
  `tipon-web`'s installed `lucide-react` package for visual parity, since Blade
  has no equivalent icon library). The event detail page adds a hero banner with
  a legibility gradient over the real cover image, an icon-labeled info grid
  (date/time/venue/organizer), and a registration panel with a large seats-filled
  stat, a spots-left counter, and a fill-percentage readout. Two features visible
  in the original design mockups were deliberately left out: category filter
  chips/badges and a stats row on the login page, since neither has real backing
  data in the schema (no `category` column, no real usage history) — shipping
  either would mean showing fabricated information to real users.

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

### Known limitation: separate port in local dev

Locally, the Livewire pages are reached at **`http://localhost:8000/events`**
directly, not proxied under `http://localhost:5173` like the rest of the SPA. This
was attempted (a Vite dev-server proxy) and hit a hard wall: Livewire's own
JavaScript makes its AJAX calls with the browser's default fetch credentials mode,
never opting into `credentials: 'include'` (confirmed by inspecting the shipped
`livewire.js` — zero occurrences of `credentials` anywhere in it). That means the
session cookie never travels with those requests once the *page* and the *AJAX
target* are different origins, so search/register/cancel all fail with a `419`
no matter how the network routing is configured. This is specifically a **local
development** artifact of running two separate dev servers — in a real deployment,
both apps would sit behind one actual domain via a reverse proxy, making them
genuinely the same origin, and this limitation disappears entirely.

### React vs. Livewire — what building both actually showed

| | React SPA (`tipon-web`) | Livewire (this branch) |
|---|---|---|
| **Where state lives** | Client-side, in the browser (`AppStore.tsx` context) | Server-side, re-rendered per request; the browser only holds a serialized snapshot |
| **How it talks to the backend** | Explicit REST API calls (`axios`) to `tipon-api` | Direct Eloquent queries inside the component — no API layer needed for that page |
| **Adding this feature from scratch** | Requires a UI layer *and* API endpoints, kept in sync manually | Faster for a single CRUD-ish page — one file, no separate endpoint to design/version |
| **Matching an existing design system** | N/A — it *is* the design system (Radix UI + Tailwind, iterated over many passes) | Manual, one utility class at a time — no Radix UI equivalent ships with Livewire, so parity took deliberate copying of color tokens and layout structure |
| **Auth model** | Stateless bearer tokens — simple, portable to any client type | Stateful sessions — required extending the existing token-based `AuthController` to *also* support sessions, without breaking the original flow |
| **Cross-origin tolerance** | Designed for it from day one (that's the whole point of a decoupled API) | Assumes same-origin everywhere; breaks in ways that are hard to fully work around once that assumption doesn't hold |
| **Best fit** | An app that needs a real decoupled client (this SPA today, potentially a mobile app later) talking to one API | A Laravel-only monolith where the backend and the only frontend are never meant to be separate things |

**Takeaway:** Tipon's actual architecture — a decoupled React SPA over a Laravel
REST API — remains the right call for a system that needs a rich, client-rendered
UI and room to add other API clients later. Livewire is a legitimate, often faster
choice when the whole app *is* Laravel end-to-end with no separate client planned;
retrofitting it onto two pages of an already-decoupled app is possible (as this
branch demonstrates) but works against several of Livewire's built-in assumptions,
which is exactly what the auth and cross-origin sections above ran into.

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
- Role-based access enforced via middleware on every protected route.
- Registration capacity checks are transaction-safe under concurrent load
  (row-level locking).
- Responsive UI targeting Chrome, Firefox, and Edge.
