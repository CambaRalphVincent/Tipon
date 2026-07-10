# Project Map

## What Tipon Is

Tipon is a university Event Registration System. It replaces manual event sign-ups
with a web app where participants browse and register for events, organizers manage
events and attendance, and admins manage users and monitor platform activity.

The repository contains two main applications:

- `tipon-api`: Laravel 12 backend, REST API, Livewire participant pages,
  database rules, authentication, notifications, and uploads.
- `tipon-web`: React 19, TypeScript, and Vite frontend for authentication,
  organizer pages, admin pages, and My Registrations.

Tipon uses a mixed architecture. React handles richer dashboard-style workflows,
while Laravel Livewire handles participant event browsing and event detail pages.
Both use the same Laravel domain logic and database.

## How to Run the Project

Backend setup:

```bash
cd tipon-api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
composer run dev:win
```

Frontend setup:

```bash
cd tipon-web
npm install
npm run dev
```

Typical local URLs:

- React app: `http://localhost:5173`
- Laravel app: `http://localhost:8000`
- Livewire participant pages: `http://localhost:8000/events`
- API routes: `http://localhost:8000/api/...`

Seeded admin login:

- Email: `admin@tipon.com`
- Password: `password`

## Important Commands

Backend verification:

```bash
cd tipon-api
php artisan test
```

Frontend verification:

```bash
cd tipon-web
npm run test
npm run lint
npm run build
```

Git review commands:

```bash
git status -sb
git diff --stat
git diff --name-status
git diff --check
```

## Important Folders

- `tipon-api/app/Http/Controllers`: Laravel API and page controller logic.
- `tipon-api/app/Http/Middleware`: route access middleware, including role checks.
- `tipon-api/app/Livewire`: Livewire participant event page classes.
- `tipon-api/app/Models`: Eloquent models for users, events, and registrations.
- `tipon-api/app/Notifications`: Laravel notification classes.
- `tipon-api/app/Services`: notification orchestration services.
- `tipon-api/database/migrations`: database schema and integrity constraints.
- `tipon-api/resources/views`: Blade and Livewire views.
- `tipon-api/routes`: API, web, and console routes.
- `tipon-web/src/app/pages`: React page-level screens.
- `tipon-web/src/app/components`: shared React UI components.
- `tipon-web/src/app/components/ui`: Radix-style reusable UI primitives.
- `tipon-web/src/app/lib`: frontend helper logic and API client.
- `tipon-web/src/app/store`: shared app state and data adapters.
- `tipon-web/src/app/tests`: Vitest and React Testing Library tests.
- `docs`: project documentation.

## Entry Points

Backend:

- `tipon-api/public/index.php`: Laravel HTTP entry point.
- `tipon-api/bootstrap/app.php`: Laravel route, middleware, and exception setup.
- `tipon-api/routes/api.php`: JSON API routes under `/api`.
- `tipon-api/routes/web.php`: session-authenticated browser routes for Livewire.

Frontend:

- `tipon-web/src/main.tsx`: React bootstrapping.
- `tipon-web/src/app/App.tsx`: React providers, route gating, and page routing.
- `tipon-web/src/app/store/AppStore.tsx`: shared client state and workflow actions.
- `tipon-web/src/app/lib/api.ts`: Axios API client and endpoint functions.

## Frontend Pages / Routes

React routes:

- `/`: login, registration, and email verification UI.
- `/my-registrations`: participant registration history.
- `/organizer`: organizer dashboard.
- `/organizer/events`: organizer event management.
- `/organizer/events/:id`: organizer registrant list and attendance recording.
- `/admin`: admin user management.
- `/admin/events`: admin event monitoring.

Participant event browsing is not handled by React Router. React redirects users to
Laravel Livewire pages for:

- `/events`
- `/events/{event}`

This matters because React runs on the Vite origin during development, while
Livewire runs on the Laravel origin.

## Backend / API Routes

Public API routes:

- `POST /api/register`
- `POST /api/login`
- `POST /api/email/verify`
- `POST /api/email/resend`

Authenticated API routes:

- `POST /api/logout`
- `GET /api/me`
- `GET /api/events`
- `GET /api/events/{event}`
- `GET /api/notifications`
- `PUT /api/notifications/{id}/read`

Participant-only API routes:

- `GET /api/my-registrations`
- `POST /api/events/{event}/registrations`
- `DELETE /api/registrations/{registration}`

Organizer-only API routes:

- `POST /api/upload`
- `POST /api/events`
- `PUT /api/events/{event}`
- `DELETE /api/events/{event}`
- `GET /api/organizer/registrations`
- `GET /api/events/{event}/registrations`
- `PUT /api/registrations/{registration}/attendance`

Admin-only API routes:

- `GET /api/admin/users`
- `POST /api/admin/organizers`
- `PUT /api/admin/users/{user}/promote`

Livewire web routes:

- `GET /events`
- `GET /events/{event}`
- `POST /events/{event}/register`
- `POST /events/{event}/cancel-registration`
- `POST /notifications/{notification}/read`
- `POST /notifications/read-all`
- `POST /logout-livewire`

## Database / Models / Migrations

Core models:

- `User`: account record for participants, organizers, and admins.
- `Event`: organizer-owned event.
- `Registration`: participant registration for an event.

Core tables:

- `users`: stores all roles in one table using the `role` column.
- `events`: stores event details, capacity, date, status, and optional cover image.
- `registrations`: links participants to events and stores attendance state.
- `notifications`: Laravel database notification table.

Important database integrity rules:

- Users have a role of `participant`, `organizer`, or `admin`.
- A participant cannot have two active registrations for the same event.
- An organizer cannot have two active open events with the same title,
  case-insensitively.
- Event capacity is derived from active registrations, not stored as a separate
  counter.
- Cancelling events and registrations changes status instead of deleting records.

## Authentication / Authorization

Tipon uses Laravel Sanctum and Laravel session authentication together:

- React API calls use Sanctum/session-backed API authentication.
- Livewire pages use Laravel browser sessions.
- The same login flow can establish both when the browser request is stateful.

Role authorization is enforced server-side through the `role` middleware. The React
UI also hides or redirects screens by role, but the backend route middleware is the
real security boundary.

Login states are intentionally distinct:

- `404`: no account exists for that email.
- `401`: email exists but password is wrong.
- `403`: account exists but email verification is required.

## Environment Variables

Backend environment values are based on `tipon-api/.env.example`.

Important backend variables:

- `APP_URL`
- `FRONTEND_URL`
- `DB_CONNECTION`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `SESSION_DOMAIN`
- `SANCTUM_STATEFUL_DOMAINS`
- `MAIL_MAILER`
- `MAIL_FROM_ADDRESS`
- `BREVO_API_KEY`

Frontend API base URL:

- `VITE_API_URL`, if set.
- Otherwise the frontend defaults to `http://localhost:8000/api`.

No `tipon-web/.env.example` file was present when this map was created.

## Core Workflows

### Registration and Email Verification

Participant registration starts in the React auth page, calls the Laravel API, and
creates an unverified participant account. Laravel emails a 6-digit verification
code. The user must verify the code before receiving access.

Organizer accounts are created by admins and also require email verification before
login.

### Event Management

Organizers create, edit, and cancel their own events. Laravel validates title,
description, venue, future event date, capacity, and optional cover image path.
The backend rejects duplicate active event titles for the same organizer.

### Participant Event Registration

Participant registration is the most important business-critical workflow.
Laravel locks the event row inside a database transaction before checking capacity
and creating the registration. This prevents concurrent overbooking.

### Attendance Recording

Organizers mark registrants as `pending`, `present`, or `absent`. Attendance is
stored on the `registrations` table and used for organizer dashboard statistics.

### Notifications

Laravel database notifications are used for participant, organizer, and admin
messages. React adapts notification rows into frontend display types. Livewire
reads notifications directly from Laravel.

## Data Flow

Typical React data flow:

```txt
React page/component
-> AppStore action
-> api.ts Axios call
-> Laravel API route
-> Controller
-> Eloquent model / database
-> JSON response
-> AppStore updates UI state
```

Typical Livewire participant data flow:

```txt
Browser visits /events
-> routes/web.php
-> EventController page method
-> Livewire component
-> Eloquent query
-> Blade/Livewire view
```

Example organizer event creation:

```txt
ManageEvents / EventFormDialog
-> AppStore.createEvent()
-> eventsApi.create()
-> POST /api/events
-> EventController::store()
-> events table
-> notification services
-> React updates events list
```

Example participant registration:

```txt
Participant chooses event
-> registration route or API call
-> RegistrationController
-> Event::lockForUpdate()
-> capacity and duplicate checks
-> registrations table
-> notifications
```

## Tests

Backend tests live under `tipon-api/tests`.

Important backend test areas:

- access control
- authentication
- admin organizer management
- event management
- registration capacity and duplicate prevention
- attendance
- uploads
- notifications
- Livewire participant route behavior
- database constraints

Frontend tests live under `tipon-web/src/app/tests`.

Important frontend test areas:

- auth UI
- role navigation
- admin dashboard
- organizer dashboard
- event browsing and forms
- registrations
- attendance
- notifications
- store behavior
- shared components

## Build and Deployment

Backend build/runtime concerns:

- Composer dependencies.
- `.env` configuration.
- Database migrations and seeders.
- Storage link for uploaded cover images.
- Queue/listener behavior for notifications and mail.

Frontend build concerns:

- npm dependencies.
- TypeScript build.
- Vite build.
- `VITE_API_URL` when the API is not at the default local URL.

In production, React and Laravel should be deployed behind a consistent domain or
reverse proxy so Sanctum, session cookies, CORS, and Livewire assumptions stay
aligned.

## Risky Files

Review these carefully before changing them:

- `tipon-api/routes/api.php`
- `tipon-api/routes/web.php`
- `tipon-api/bootstrap/app.php`
- `tipon-api/config/auth.php`
- `tipon-api/config/cors.php`
- `tipon-api/config/sanctum.php`
- `tipon-api/config/session.php`
- `tipon-api/app/Http/Controllers/AuthController.php`
- `tipon-api/app/Http/Controllers/EventController.php`
- `tipon-api/app/Http/Controllers/RegistrationController.php`
- `tipon-api/app/Http/Controllers/AdminController.php`
- `tipon-api/app/Http/Controllers/UploadController.php`
- `tipon-api/app/Http/Middleware/RequireRole.php`
- `tipon-api/database/migrations/*`
- `tipon-web/src/app/lib/api.ts`
- `tipon-web/src/app/store/AppStore.tsx`
- `tipon-web/src/app/App.tsx`
- `tipon-web/package.json`
- `tipon-web/package-lock.json`
- `tipon-api/composer.json`
- `tipon-api/composer.lock`

## Common Errors

- React cannot reach the API: check `VITE_API_URL`, Laravel server status, CORS,
  Sanctum stateful domains, and session cookie settings.
- Livewire pages redirect to React login: user is not session-authenticated or is
  not a participant.
- Login succeeds in API but Livewire is unauthenticated: check Sanctum stateful
  domain and session configuration.
- Event registration fails: event may be completed, cancelled, full, already
  registered, or past its event date.
- Organizer cannot edit an event: event may belong to another organizer or may
  already be completed.
- Cover upload fails: file may be larger than 2 MB or not JPG, PNG, or WEBP.
- Email verification does not send: check `MAIL_MAILER`, Brevo configuration, or
  Laravel logs when using `MAIL_MAILER=log`.

## Notes for Future AI-Assisted Work

- Start by identifying whether the workflow is React, Livewire, or API-owned.
- Treat Laravel as the source of truth for validation, permissions, and database
  integrity.
- Keep frontend validation as user feedback only; backend validation is the
  security boundary.
- Avoid changing auth, role middleware, migrations, or Sanctum/session settings
  casually.
- Do not add dependencies unless the existing stack cannot solve the problem.
- Prefer one workflow at a time: auth, events, registrations, attendance,
  notifications, or admin.
- After any change, inspect the diff before committing.

