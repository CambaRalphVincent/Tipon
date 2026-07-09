# Tipon Control Files

This guide maps the files that control Tipon's dependencies, routing, database,
environment variables, and build commands.

Tipon is split into two main application folders:

- `tipon-api`: Laravel backend REST API, Livewire participant pages, database,
  authentication, email, queues, and backend tests.
- `tipon-web`: React + TypeScript + Vite frontend for auth, organizer, admin,
  and My Registrations screens.

## Dependencies

### Backend PHP Dependencies

Controlled by:

- `tipon-api/composer.json`
- `tipon-api/composer.lock`

`composer.json` declares the PHP packages the backend needs, including Laravel,
Sanctum, Livewire, Brevo mailer support, PHPUnit, Pint, and other development
tools.

`composer.lock` records the exact installed package versions. When installing
the project, Composer uses this lock file so every developer gets the same PHP
dependency versions.

Common commands:

```bash
cd tipon-api
composer install
composer update
```

### Backend Asset Dependencies

Controlled by:

- `tipon-api/package.json`
- `tipon-api/package-lock.json`

These npm files are for Laravel's own Vite/Tailwind assets, mainly the
server-rendered Livewire/Blade side of the backend.

Common commands:

```bash
cd tipon-api
npm install
npm run dev
npm run build
```

### Frontend React Dependencies

Controlled by:

- `tipon-web/package.json`
- `tipon-web/package-lock.json`

`package.json` declares React, Vite, Radix UI, Tailwind, Axios, React Router,
Recharts, Vitest, TypeScript, and other frontend packages.

`package-lock.json` records the exact installed npm versions.

Common commands:

```bash
cd tipon-web
npm install
npm run dev
npm run build
```

Generated dependency folders should not be edited directly:

- `tipon-api/vendor`
- `tipon-api/node_modules`
- `tipon-web/node_modules`
- `tipon-web/dist`

## Routing

Tipon has both backend routes and frontend routes.

### Backend API Routes

Controlled by:

- `tipon-api/routes/api.php`

This file defines the JSON API routes under `/api`, including:

- Auth: `/register`, `/login`, `/logout`, `/me`, `/email/verify`,
  `/email/resend`
- Events: `/events`, `/events/{event}`
- Registrations: `/my-registrations`, `/events/{event}/registrations`,
  `/registrations/{registration}`
- Attendance: `/registrations/{registration}/attendance`
- Uploads: `/upload`
- Notifications: `/notifications`, `/notifications/{id}/read`
- Admin: `/admin/users`, `/admin/organizers`, `/admin/users/{user}/promote`

It also controls route protection with middleware such as:

- `auth:sanctum`
- `role:participant`
- `role:organizer`
- `role:admin`

### Backend Web and Livewire Routes

Controlled by:

- `tipon-api/routes/web.php`

This file defines session-authenticated browser routes, especially the
participant-facing Livewire pages:

- `GET /events`
- `GET /events/{event}`
- `POST /events/{event}/register`
- `POST /events/{event}/cancel-registration`
- `POST /notifications/read-all`
- `POST /notifications/{notification}/read`
- `POST /logout-livewire`

These are not JSON API routes. They render or submit traditional browser pages
served by Laravel.

### Laravel Route Registration and Middleware

Controlled by:

- `tipon-api/bootstrap/app.php`

This file tells Laravel where the route files are:

- `routes/web.php`
- `routes/api.php`
- `routes/console.php`

It also registers the custom `role` middleware and enables Sanctum's stateful API
behavior for the React SPA.

### Frontend React Routes

Controlled by:

- `tipon-web/src/app/App.tsx`

This file uses React Router and defines the client-side SPA routes:

- `/`
- `/my-registrations`
- `/organizer`
- `/organizer/events`
- `/organizer/events/:id`
- `/admin`
- `/admin/events`
- fallback route `*`

Participant `/events` pages are not handled by React Router. They are served by
Laravel Livewire, so React performs a hard redirect to the backend origin for
those pages.

### Frontend Navigation

Controlled by:

- `tipon-web/src/app/lib/navigation.ts`

This file defines role-specific navigation items:

- Participant navigation
- Organizer navigation
- Admin navigation

### Frontend API Client

Controlled by:

- `tipon-web/src/app/lib/api.ts`

This file defines:

- `VITE_API_URL` fallback behavior
- Axios base URL
- Sanctum CSRF-cookie setup
- API wrapper functions for auth, events, registrations, notifications, uploads,
  and admin actions
- `LIVEWIRE_BASE_URL` for absolute navigation to Laravel Livewire pages

## Database

### Database Connection

Controlled by:

- `tipon-api/config/database.php`
- `tipon-api/.env`
- `tipon-api/.env.example`

`config/database.php` reads environment variables such as:

- `DB_CONNECTION`
- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`

The README recommends PostgreSQL for Tipon:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=tipon
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

### Database Schema

Controlled by:

- `tipon-api/database/migrations`

Important migrations include:

- `0001_01_01_000000_create_users_table.php`: users, sessions, password reset
  tokens
- `0001_01_01_000001_create_cache_table.php`: cache tables
- `0001_01_01_000002_create_jobs_table.php`: queue job tables
- `2026_07_01_033951_create_events_table.php`: events
- `2026_07_01_033958_create_registrations_table.php`: registrations and
  duplicate active-registration prevention
- `2026_07_01_034013_create_notifications_table.php`: notifications
- `2026_07_01_050358_create_personal_access_tokens_table.php`: Sanctum tokens
- `2026_07_01_120000_add_admin_role_to_users_table.php`: admin role support
- `2026_07_02_012801_add_email_verification_code_to_users_table.php`: email
  verification OTP fields
- `2026_07_02_030244_add_organizer_title_unique_index_to_events_table.php`:
  unique active event title per organizer
- `2026_07_06_000000_add_completed_status_to_events_table.php`: completed event
  status support

Run migrations with:

```bash
cd tipon-api
php artisan migrate
```

Run migrations and seed the default admin with:

```bash
php artisan migrate --seed
```

### Seed Data

Controlled by:

- `tipon-api/database/seeders/DatabaseSeeder.php`

This creates the seeded admin account:

- Email: `admin@tipon.com`
- Password: `password`

### Database Models

Controlled mainly by:

- `tipon-api/app/Models/User.php`
- `tipon-api/app/Models/Event.php`
- `tipon-api/app/Models/Registration.php`

These files define fillable fields, casts, relationships, status constants, and
model-level behavior.

### Notification Behavior

Controlled mainly by:

- `tipon-api/app/Notifications/RegistrationStatusNotification.php`
- `tipon-api/app/Notifications/OrganizerRegistrationNotification.php`
- `tipon-api/app/Notifications/OrganizerEventNotification.php`
- `tipon-api/app/Notifications/AdminSystemNotification.php`
- `tipon-api/app/Services/OrganizerNotificationService.php`
- `tipon-api/app/Services/AdminNotificationService.php`
- `tipon-api/app/Http/Controllers/NotificationController.php`

These files define participant notification payloads, organizer registration
activity notifications, organizer capacity/reminder/cancellation-summary
notifications, admin new-event notifications, admin unverified-organizer
reminders, admin event-cancellation summaries, idempotent reminder creation, and
notification read/list behavior.

## Environment Variables

### Backend Environment

Controlled by:

- `tipon-api/.env`
- `tipon-api/.env.example`

`.env` contains local values and may contain secrets. Do not commit real secrets.

`.env.example` is the safe template showing which variables the app expects.

Important backend variable groups:

- `APP_*`: app name, app URL, key, environment, debug mode, timezone
- `DB_*`: database connection settings
- `SESSION_*`: Laravel session settings
- `SANCTUM_STATEFUL_DOMAINS`: frontend origins allowed to use Sanctum cookies
- `FRONTEND_URL`: React SPA origin used for redirects
- `QUEUE_CONNECTION`: queue backend
- `CACHE_STORE`: cache backend
- `MAIL_*`: email transport settings
- `BREVO_API_KEY`: Brevo transactional email API key
- `AWS_*`: optional storage/service credentials
- `VITE_APP_NAME`: Laravel Vite-exposed app name

Backend config files that consume these variables include:

- `tipon-api/config/app.php`
- `tipon-api/config/database.php`
- `tipon-api/config/mail.php`
- `tipon-api/config/services.php`
- `tipon-api/config/sanctum.php`
- `tipon-api/config/cors.php`
- `tipon-api/config/session.php`
- `tipon-api/config/queue.php`
- `tipon-api/config/cache.php`
- `tipon-api/config/filesystems.php`

### Frontend Environment

Controlled by:

- `tipon-web/.env`

Current frontend variable:

- `VITE_API_URL`

This is read in:

- `tipon-web/src/app/lib/api.ts`

Example:

```env
VITE_API_URL=http://localhost:8000/api
```

In Vite, only variables prefixed with `VITE_` are exposed to browser code.

## Build and Dev Commands

### Backend Composer Commands

Controlled by:

- `tipon-api/composer.json`

Important scripts:

```bash
cd tipon-api
composer run setup
composer run dev
composer run dev:win
composer test
```

`composer run dev` starts:

- Laravel API server
- Queue listener
- Pail log tailer
- Laravel Vite dev server

`composer run dev:win` is the Windows-friendly variant without Pail.

### Backend Asset Commands

Controlled by:

- `tipon-api/package.json`

Scripts:

```bash
cd tipon-api
npm run dev
npm run build
```

The build behavior is configured by:

- `tipon-api/vite.config.js`

That Vite config uses:

- `laravel-vite-plugin`
- `@tailwindcss/vite`
- `resources/css/app.css`
- `resources/js/app.js`

### Frontend React Commands

Controlled by:

- `tipon-web/package.json`

Scripts:

```bash
cd tipon-web
npm run dev
npm run build
npm run lint
npm run test
npm run preview
```

What they do:

- `npm run dev`: starts the React Vite dev server
- `npm run build`: runs TypeScript build checks and creates a production Vite
  build
- `npm run lint`: runs oxlint
- `npm run test`: runs Vitest using `vitest.config.ts`
- `npm run preview`: previews the production build locally

Frontend Vite build behavior is configured by:

- `tipon-web/vite.config.ts`

Frontend test behavior is configured by:

- `tipon-web/vitest.config.ts`

TypeScript project settings are controlled by:

- `tipon-web/tsconfig.json`
- `tipon-web/tsconfig.app.json`
- `tipon-web/tsconfig.node.json`

## Quick Lookup

| Concern | Main file or folder |
|---|---|
| Backend PHP packages | `tipon-api/composer.json` |
| Backend PHP exact versions | `tipon-api/composer.lock` |
| Backend asset packages | `tipon-api/package.json` |
| Frontend packages | `tipon-web/package.json` |
| Frontend exact npm versions | `tipon-web/package-lock.json` |
| API routes | `tipon-api/routes/api.php` |
| Livewire/browser routes | `tipon-api/routes/web.php` |
| React routes | `tipon-web/src/app/App.tsx` |
| React navigation menu | `tipon-web/src/app/lib/navigation.ts` |
| React API client | `tipon-web/src/app/lib/api.ts` |
| Database connection | `tipon-api/config/database.php` |
| Database tables/schema | `tipon-api/database/migrations` |
| Seeded admin | `tipon-api/database/seeders/DatabaseSeeder.php` |
| Backend env template | `tipon-api/.env.example` |
| Backend local env | `tipon-api/.env` |
| Frontend local env | `tipon-web/.env` |
| Laravel app config | `tipon-api/config/app.php` |
| Mail config | `tipon-api/config/mail.php` |
| Third-party service keys | `tipon-api/config/services.php` |
| Sanctum config | `tipon-api/config/sanctum.php` |
| CORS config | `tipon-api/config/cors.php` |
| Backend Composer scripts | `tipon-api/composer.json` |
| Backend Vite config | `tipon-api/vite.config.js` |
| Frontend Vite config | `tipon-web/vite.config.ts` |
| Frontend test config | `tipon-web/vitest.config.ts` |
