# Tipon User Manual

## 1. Introduction

Tipon is a University Event Registration System. It helps participants browse
events, reserve slots, cancel registrations, and track registration history. It
also helps organizers create events, manage registrants, record attendance, and
monitor event capacity. Administrators use Tipon to manage participant and
organizer accounts.

This manual explains how to use Tipon from the point of view of each user role:

- Participant
- Organizer
- Admin

## 2. Intended Users

| User role | Main purpose |
|---|---|
| Participant | Browse events, register for events, cancel registrations, view registration history, and receive notifications. |
| Organizer | Create and manage events, view registrants, record attendance, and monitor event statistics. |
| Admin | Manage users, create organizer accounts, promote participants to organizers, monitor events, and receive admin notifications. |

## 3. System Access

Tipon has two local development addresses:

| Area | Local address |
|---|---|
| React app | `http://localhost:5173` |
| Laravel app and Livewire participant pages | `http://localhost:8000` |
| Participant Browse Events page | `http://localhost:8000/events` |
| API routes | `http://localhost:8000/api/...` |

For normal browser use, start at:

```text
http://localhost:5173
```

In a deployed environment, use the web address provided by the system
administrator.

## 4. Account Types and Access Rules

### Participant

Participants can create their own account from the Tipon sign-in page. After
registration, participants must verify their email using a 6-digit verification
code before they can continue.

Participants can:

- Browse available events
- View event details
- Register for open events with available slots
- Cancel their own registrations
- View upcoming events, past events, and cancelled registrations
- Read notifications
- Change the display theme

### Organizer

Organizer accounts are created by an admin. Organizers do not self-register.
After receiving account credentials from the admin, organizers sign in and verify
their email using the code sent to their inbox.

Organizers can:

- View their dashboard
- Create events
- Edit their events
- Cancel open events
- View event registrants
- Record attendance as present or absent
- Read notifications
- Change the display theme

### Admin

Admins manage user accounts and monitor platform events.

Admins can:

- View participant and organizer accounts
- Search users
- Create organizer accounts
- Promote participants to organizer
- Review all platform events by status and capacity
- Read admin notifications

## 5. Signing In

1. Open Tipon in the browser.
2. Enter your email address.
3. Enter your password.
4. Click `Sign in`.

After signing in, Tipon redirects you based on your role:

| Role | Destination |
|---|---|
| Participant | Browse Events |
| Organizer | Organizer Dashboard |
| Admin | User Management |

If the email is not registered, Tipon shows a missing-account message. If the
password is wrong, Tipon shows an invalid-credentials message. If the account is
not verified, Tipon asks for the email verification code.

## 6. Creating a Participant Account

Only participants create their own account.

1. Open Tipon.
2. Click `Create an account`.
3. Enter your full name.
4. Enter your email address.
5. Enter a password.
6. Confirm the password.
7. Click `Create account & continue`.
8. Check your email for the 6-digit verification code.
9. Enter the code.
10. Click `Verify & continue`.

Password requirements:

- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one symbol

If the code does not arrive, click `Resend code`.

## 7. Participant Guide

### 7.1 Browse Events

The Browse Events page shows available events as cards.

Each event card may show:

- Event image
- Event title
- Description
- Date and time
- Venue
- Capacity progress
- Status such as Registered, Full, or Cancelled

To search for an event:

1. Go to `Browse Events`.
2. Type a keyword in the search box.
3. Press Enter or click the search icon.

You can search by event title or venue. The search is not case-sensitive.

### 7.2 View Event Details

1. Go to `Browse Events`.
2. Click an event card or `View details`.

The Event Detail page shows:

- Event title
- Event description
- Date
- Time
- Venue
- Organizer
- Number of seats filled
- Remaining slots
- Registration status

### 7.3 Register for an Event

You can register only if:

- The event is open
- The event has not ended
- The event is not full
- You are not already registered for the event

Steps:

1. Open the event detail page.
2. Click `Register now`.
3. Review the confirmation dialog.
4. Click `Confirm registration`.

After registration, the page shows that you are registered. The system also
updates the event capacity count.

### 7.4 Cancel a Registration

You can cancel an upcoming registration if the event has not ended.

Steps:

1. Open the event detail page for an event you registered for.
2. Click `Cancel registration`.
3. Review the confirmation dialog.
4. Click `Cancel registration` again to confirm.

Your slot is released so another participant can register if space is available.

### 7.5 View My Registrations

1. Click `My Registrations` in the sidebar.
2. Use the tabs to switch between:
   - `Upcoming Events`
   - `Past Events`
   - `Cancelled`

Upcoming Events shows events you are currently registered for. Past Events shows
completed events and attendance status. Cancelled shows recent cancellations.

### 7.6 Cancel from My Registrations

1. Go to `My Registrations`.
2. Open the `Upcoming Events` tab.
3. Find the event.
4. Click `Cancel`.
5. Confirm by clicking `Cancel registration`.

### 7.7 Notifications

Notifications inform you about registration and event updates.

To view notifications:

1. Click the bell icon in the top-right area.
2. Read the notification list.
3. Click a notification to mark it as read and, when available, open the
   related event page.
4. If available, click `Mark all read` to clear all unread notifications.

## 8. Organizer Guide

### 8.1 Organizer Dashboard

After signing in, organizers land on the Dashboard.

The Dashboard shows:

- Active events
- Total registrations
- Total capacity
- Attendance rate
- Upcoming active events
- Registration and capacity charts
- Attendance summary

Click `Manage events` or `Manage all` to open the event management page.

### 8.2 Create an Event

1. Go to `Manage Events`.
2. Click `Create event`.
3. Fill in the event details:
   - Thumbnail
   - Title
   - Description
   - Venue
   - Date
   - Time
   - Capacity
4. Click `Create event`.

Event field rules:

| Field | Rule |
|---|---|
| Title | Required, maximum 100 characters |
| Description | Maximum 1000 characters |
| Venue | Required |
| Date | Required, must be a future date and time |
| Capacity | Required, must be greater than 0 |
| Thumbnail | Optional, JPG, PNG, or WEBP, maximum 2 MB |

An organizer cannot have two active open events with the same title. If the
title is already used by one of your open events, choose a different title or
cancel the existing event first.

### 8.3 Edit an Event

You can edit events that are not completed.

From Manage Events:

1. Go to `Manage Events`.
2. Find the event.
3. Open the event actions menu.
4. Click `Edit`.
5. Update the event details.
6. Click `Save changes`.

From Registrant List:

1. Open an event from `Manage Events`.
2. Click `Edit event`.
3. Update the event details.
4. Click `Save changes`.

If registered participants exist, the system prevents reducing capacity below the
current number of active registrations.

### 8.4 Cancel an Event

You can cancel only open events.

Steps:

1. Go to `Manage Events`.
2. Find the event.
3. Open the event actions menu.
4. Click `Cancel event`.
5. Review the confirmation dialog.
6. Click `Cancel event` to confirm.

When an event is cancelled:

- The event status changes to Cancelled.
- Active registrations are cancelled.
- Affected participants are notified.
- The organizer receives a cancellation summary notification.
- The event title becomes available for reuse.

### 8.5 Filter Events

On the Manage Events page, use the status filters:

- `All`
- `Open`
- `Completed`
- `Cancelled`

These filters help you review only the events you need.

### 8.6 View Registrants

1. Go to `Manage Events`.
2. Click an event row, or open the actions menu and click `View registrants`.

The Registrant List page shows:

- Event title
- Event status
- Date, time, and venue
- Registered count
- Present count
- Absent count
- Remaining slots
- Participant list
- Attendance controls

### 8.7 Search Registrants

1. Open an event's Registrant List page.
2. Type a name or email in `Search registrants...`.

The table updates to show matching registrants.

### 8.8 Record Attendance

1. Open an event's Registrant List page.
2. Find the participant.
3. Click `Present` to mark the participant present.
4. Click `Absent` to mark the participant absent.

Clicking the selected attendance option again returns the status to pending.

Attendance statuses:

| Status | Meaning |
|---|---|
| Pending | Attendance has not been recorded yet |
| Present | Participant attended |
| Absent | Participant did not attend |

### 8.9 Organizer Notifications

Organizer notifications appear from the bell icon in the top-right area. Click a
notification to mark it as read and open the related event, registrant list, or
event inventory page.

Organizers may receive notifications when:

- A participant registers for one of their events.
- A participant cancels their registration.
- An event reaches 90% capacity.
- An event becomes full.
- An open event starts within 24 hours.
- A completed event still has pending attendance records.
- An event cancellation summary is available after cancelling an event.

## 9. Admin Guide

### 9.1 User Management

After signing in as admin, Tipon opens the User Management page.

This page shows:

- All users
- User names
- Emails
- Roles
- Join dates
- Participant and organizer counts

### 9.2 Event Monitoring

The Event Monitoring page helps admins review events across all organizers.

This page shows:

- Total events
- Open events
- Full events
- Cancelled events
- Event title and venue
- Organizer name
- Schedule
- Capacity usage
- Event status
- A details drawer for a selected event

To review events:

1. Click `Event Monitoring` in the sidebar.
2. Use the status filters to show `All`, `Open`, `Completed`, or `Cancelled` events.
3. Type an event title, venue, or organizer name in the search box to narrow the table.
4. Click an event row to open its details drawer.

The details drawer shows the selected event's venue, organizer, schedule, status,
capacity usage, registered count, remaining slots, fill rate, event ID, and
description when available. Admin event notifications can also open this drawer
directly for the related event.

### 9.3 Search Users

1. Go to `User Management`.
2. Type a name or email in `Search users...`.

The table updates to show matching accounts.

### 9.4 Create an Organizer Account

1. Click `New Organizer`.
2. Enter the organizer's full name.
3. Enter the organizer's email address.
4. Enter a temporary password.
5. Confirm the password.
6. Click `Create organizer`.

The organizer must sign in using the password provided by the admin. On first
sign-in, the organizer must enter the verification code sent to their email.

Use the same password requirements as participant registration:

- At least 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one symbol

### 9.5 Promote a Participant to Organizer

1. Go to `User Management`.
2. Find the participant.
3. Click `Promote`.
4. Review the confirmation dialog.
5. Click `Promote`.

Important effect:

When a participant is promoted, they become an organizer. They can create and
manage events, but they lose participant access and can no longer register for
events.

### 9.6 Admin Notifications

Admin notifications appear from the bell icon in the top-right area. Click a
notification to mark it as read and open the related admin page. Event-related
admin notifications open the matching Event Monitoring details drawer.

Admins may receive notifications when:

- An organizer creates a new event.
- An organizer account remains unverified for more than 24 hours.
- An organizer cancels an event that had active registered participants.

## 10. Shared Features

### 10.1 Sidebar Navigation

Tipon shows role-specific navigation.

Participant navigation:

- Browse Events
- My Registrations

Organizer navigation:

- Dashboard
- Manage Events

Admin navigation:

- User Management
- Event Monitoring

On mobile, click the menu icon to open or close the sidebar.

### 10.2 Theme Switcher

Click the theme icon in the top-right area to change the display theme.

Available themes:

- Bayanihan Gold
- Tropical Teal
- Festival Sunset

### 10.3 Sign Out

1. Open the sidebar.
2. Click `Sign out`.

Tipon returns you to the sign-in page.

## 11. Common Messages and What They Mean

| Message or state | Meaning | What to do |
|---|---|---|
| Invalid credentials | The email exists, but the password is wrong. | Check the password and try again. |
| Account not found | No account uses that email. | Create an account or ask an admin for access. |
| Verify your email | The account exists but needs email verification. | Enter the 6-digit code from your email. |
| Event is full | No slots are available. | Choose another event or check later. |
| Event cancelled | The organizer cancelled the event. | No registration is allowed. |
| Event completed | The event has already finished. | View it for reference only. |
| Events cannot be scheduled in the past | The selected event date and time has already passed. | Choose a future date and time. |
| You already have an active event with this title | An organizer already has an open event with the same title. | Use a different title or cancel the existing event first. |
| Image must be 2 MB or smaller | The thumbnail file is too large. | Upload a smaller JPG, PNG, or WEBP file. |

## 12. Troubleshooting

### I cannot sign in

Check that:

- The email address is correct.
- The password is correct.
- The account has been verified.
- The backend server is running.

### I did not receive a verification code

Try these steps:

1. Check the email address you entered.
2. Check spam or junk mail.
3. Click `Resend code`.
4. Ask the system administrator to confirm mail settings.

### I cannot register for an event

Possible reasons:

- The event is full.
- The event is cancelled.
- The event is completed.
- The event has ended.
- You are already registered for the event.

### I cannot create an event

Check that:

- You are signed in as an organizer.
- Required fields are filled in.
- The selected date and time are in the future.
- Capacity is greater than 0.
- The title is not a duplicate of your other open events.
- The image file is JPG, PNG, or WEBP and no larger than 2 MB.

### I cannot promote a user

Check that:

- You are signed in as admin.
- The selected user is currently a participant.
- The backend server is running.

## 13. Glossary

| Term | Meaning |
|---|---|
| Participant | A user who browses and registers for events. |
| Organizer | A user who creates events and manages registrants. |
| Admin | A user who manages participant and organizer accounts. |
| Registration | A participant's reserved slot for an event. |
| Capacity | Maximum number of participants allowed for an event. |
| Attendance | Organizer-recorded status showing whether a participant was present or absent. |
| Notification | An in-app message about a registration or event update. |
| Livewire page | A Laravel-rendered page used by participants for Browse Events and Event Detail. |
| React app | The frontend app used for login, dashboards, management pages, and My Registrations. |

## 14. Manual Maintenance Checklist

Use this checklist whenever Tipon changes:

- Update this manual when a page, button, role, workflow, or validation rule changes.
- Check that screenshots, if added later, still match the current interface.
- Keep user instructions focused on what users click and what result to expect.
- Do not include private credentials, API keys, or real user data.
- Review role permissions carefully before documenting a workflow.
- Keep troubleshooting steps aligned with actual system messages.
