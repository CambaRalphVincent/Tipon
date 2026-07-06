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
        if ($event->status !== 'open') {
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
        $registration = Registration::where('event_id', $event->id)
            ->where('user_id', $request->user()->id)
            ->where('status', 'registered')
            ->first();

        if (! $registration) {
            return back()->with('error', 'No active registration was found for this event.');
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
        $eventIds = $request->user()->organizedEvents()->pluck('id');

        $registrations = Registration::whereIn('event_id', $eventIds)
            ->with(['user:id,name,email', 'event:id,title'])
            ->get();

        return response()->json($registrations);
    }

    // FR-09 — Organizer views the registrant list for an event.
    public function index(Event $event): JsonResponse
    {
        $registrations = $event->registrations()
            ->where('status', 'registered')
            ->with('user:id,name,email')
            ->get();

        return response()->json($registrations);
    }

    // Participant views their own registrations.
    public function myRegistrations(Request $request): JsonResponse
    {
        $registrations = $request->user()
            ->registrations()
            ->with('event')
            ->get();

        return response()->json($registrations);
    }

    // FR-07 — Participant registers for an event.
    public function store(Request $request, Event $event): JsonResponse
    {
        if ($event->status !== 'open') {
            return response()->json(['message' => 'Event is not open for registration.'], 422);
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
        $request->user()->notify(new RegistrationStatusNotification($event, 'registered'));

        return response()->json($registration->load('event:id,title'), 201);
    }

    // FR-08 — Participant cancels their own registration.
    public function cancel(Request $request, Registration $registration): JsonResponse
    {
        if ($registration->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $registration->update(['status' => 'cancelled']);

        // FR-11 — Notify participant of cancellation.
        $request->user()->notify(new RegistrationStatusNotification($registration->event, 'cancelled'));

        return response()->json(['message' => 'Registration cancelled.']);
    }
}
