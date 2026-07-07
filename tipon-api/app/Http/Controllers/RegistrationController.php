<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Registration;
use App\Notifications\RegistrationStatusNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class RegistrationController extends Controller
{
    public function storePage(Request $request, Event $event): RedirectResponse
    {
        $event->refreshCompletionStatus();

        if ($event->status !== Event::STATUS_OPEN) {
            return back()->with('error', 'Event is not open for registration.');
        }

        if ($event->event_date->isPast()) {
            return back()->with('error', 'Event has already ended.');
        }

        $alreadyRegistered = Registration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'registered')
            ->exists();

        if ($alreadyRegistered) {
            return back()->with('error', 'You are already registered for this event.');
        }

        try {
            DB::transaction(function () use ($event, $request) {
                $locked = Event::lockForUpdate()->findOrFail($event->id);

                if ($locked->status !== Event::STATUS_OPEN || $locked->event_date->isPast()) {
                    if ($locked->status === Event::STATUS_OPEN && $locked->event_date->isPast()) {
                        $locked->update(['status' => Event::STATUS_COMPLETED]);
                    }

                    throw new \RuntimeException('Event is not open for registration.');
                }

                if ($locked->registrations()->where('status', 'registered')->count() >= $locked->capacity) {
                    throw new \RuntimeException('Event is at full capacity.');
                }

                Registration::create([
                    'event_id' => $locked->id,
                    'user_id'  => $request->user()->id,
                    'status'   => 'registered',
                ]);
            });
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        try {
            $request->user()->notify(new RegistrationStatusNotification($event, 'registered'));
        } catch (Throwable) {
            // Registration succeeded; notification should not block the user flow.
        }

        return back()->with('success', 'You have successfully registered for this event.');
    }

    public function cancelForEventPage(Request $request, Event $event): RedirectResponse
    {
        $event->refreshCompletionStatus();

        $registration = Registration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'registered')
            ->first();

        if (! $registration) {
            return back()->with('error', 'No active registration was found for this event.');
        }

        if ($event->event_date->isPast() || $event->status === Event::STATUS_COMPLETED) {
            return back()->with('error', 'Registration can no longer be cancelled after the event date.');
        }

        $registration->update(['status' => 'cancelled']);

        try {
            $request->user()->notify(new RegistrationStatusNotification($event, 'cancelled'));
        } catch (Throwable) {
            // Cancellation succeeded; notification should not block the user flow.
        }

        return back()->with('success', 'Your registration has been cancelled.');
    }

    // Organizer views all registrations across all their events.
    public function organizerRegistrations(Request $request): JsonResponse
    {
        Event::completePastOpenEvents();

        $eventIds = $request->user()->organizedEvents()->pluck('id');

        $registrations = Registration::whereIn('event_id', $eventIds)
            ->with(['user:id,name,email', 'event:id,title'])
            ->get();

        return response()->json($registrations);
    }

    // FR-09 — Organizer views the registrant list for an event.
    public function index(Event $event): JsonResponse
    {
        $event->refreshCompletionStatus();

        if ($event->organizer_id !== request()->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $registrations = $event->registrations()
            ->where('status', 'registered')
            ->with('user:id,name,email')
            ->get();

        return response()->json($registrations);
    }

    // Participant views their own registrations.
    public function myRegistrations(Request $request): JsonResponse
    {
        Event::completePastOpenEvents();

        $registrations = $request->user()
            ->registrations()
            ->with('event')
            ->get();

        $activeEventIds = $registrations
            ->where('status', 'registered')
            ->pluck('event_id')
            ->all();

        $recentCancellationCutoff = now()->subDay();

        $visibleRegistrations = $registrations
            ->filter(fn (Registration $registration) => $registration->status === 'registered'
                || (
                    $registration->status === 'cancelled'
                    && ! in_array($registration->event_id, $activeEventIds, strict: true)
                    && $registration->updated_at->gte($recentCancellationCutoff)
                ))
            ->sortByDesc('updated_at')
            ->unique(fn (Registration $registration) => $registration->status === 'cancelled'
                ? "cancelled-event-{$registration->event_id}"
                : "registration-{$registration->id}")
            ->values();

        return response()->json($visibleRegistrations);
    }

    // FR-07 — Participant registers for an event.
    public function store(Request $request, Event $event): JsonResponse
    {
        $event->refreshCompletionStatus();

        if ($event->status !== Event::STATUS_OPEN) {
            return response()->json(['message' => 'Event is not open for registration.'], 422);
        }

        if ($event->event_date->isPast()) {
            return response()->json(['message' => 'Event has already ended.'], 422);
        }

        $alreadyRegistered = Registration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'registered')
            ->exists();

        if ($alreadyRegistered) {
            return response()->json(['message' => 'You are already registered for this event.'], 422);
        }

        try {
            $registration = DB::transaction(function () use ($event, $request) {
                // FR-17 — Lock the event row to prevent concurrent over-registration.
                $locked = Event::lockForUpdate()->findOrFail($event->id);

                if ($locked->status !== Event::STATUS_OPEN || $locked->event_date->isPast()) {
                    if ($locked->status === Event::STATUS_OPEN && $locked->event_date->isPast()) {
                        $locked->update(['status' => Event::STATUS_COMPLETED]);
                    }

                    throw new \RuntimeException('Event is not open for registration.');
                }

                if ($locked->registrations()->where('status', 'registered')->count() >= $locked->capacity) {
                    throw new \RuntimeException('Event is at full capacity.');
                }

                return Registration::create([
                    'event_id' => $locked->id,
                    'user_id'  => $request->user()->id,
                    'status'   => 'registered',
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        // FR-11 — Notify participant of successful registration.
        try {
            $request->user()->notify(new RegistrationStatusNotification($event, 'registered'));
        } catch (Throwable) {
            // Notification delivery must not undo a successful registration.
        }

        return response()->json($registration->load('event:id,title'), 201);
    }

    // FR-08 — Participant cancels their own registration.
    public function cancel(Request $request, Registration $registration): JsonResponse
    {
        if ($registration->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $registration->loadMissing('event');
        $registration->event->refreshCompletionStatus();

        if ($registration->status === 'cancelled') {
            return response()->json(['message' => 'Registration is already cancelled.'], 422);
        }

        if ($registration->event->event_date->isPast() || $registration->event->status === Event::STATUS_COMPLETED) {
            return response()->json(['message' => 'Registration can no longer be cancelled after the event date.'], 422);
        }

        $registration->update(['status' => 'cancelled']);

        // FR-11 — Notify participant of cancellation.
        try {
            $request->user()->notify(new RegistrationStatusNotification($registration->event, 'cancelled'));
        } catch (Throwable) {
            // Notification delivery must not undo a successful cancellation.
        }

        return response()->json(['message' => 'Registration cancelled.']);
    }
}
