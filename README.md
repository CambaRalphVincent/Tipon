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

**Architecture:** decoupled 3-tier — a React single-page app (`tipon-web`) talks to a
Laravel REST API (`tipon-api`) over HTTP/JSON, backed by PostgreSQL. The two apps live
in one repository but deploy and run independently.

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
