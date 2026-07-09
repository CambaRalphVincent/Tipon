<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Notifications\RegistrationStatusNotification;
use App\Services\AdminNotificationService;
use App\Services\OrganizerNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;
use Throwable;

class EventController extends Controller
{
    public function browsePage(): View
    {
        return view('events.browse');
    }

    public function detailPage(Event $event): View
    {
        return view('events.detail', compact('event'));
    }

    // FR-06 — All authenticated users can browse events.
    public function index(): JsonResponse
    {
        Event::completePastOpenEvents();

        $events = Event::with('organizer:id,name')
            ->withCount(['registrations as registered_count' => fn($q) => $q->where('status', 'registered')])
            ->get();

        return response()->json($events);
    }

    public function show(Event $event): JsonResponse
    {
        $event->refreshCompletionStatus();

        $event->loadCount(['registrations as registered_count' => fn($q) => $q->where('status', 'registered')]);

        return response()->json($event->load('organizer:id,name'));
    }

    // FR-05 — Organizer creates an event.
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title'            => ['required', 'string', 'max:100'],
            'description'      => ['nullable', 'string', 'max:1000'],
            'venue'            => ['required', 'string', 'max:255'],
            'event_date'       => ['required', 'date', 'after:now'],
            'capacity'         => ['required', 'integer', 'min:1'],
            'cover_image_path' => ['nullable', 'string', 'max:255'],
        ]);

        if ($this->hasDuplicateTitle($request->user()->id, $data['title'])) {
            return response()->json(['message' => 'You already have an active event with this title.'], 422);
        }

        $data['status'] = 'open';
        $event = $request->user()->organizedEvents()->create($data);
        $event->load('organizer:id,name')
            ->loadCount(['registrations as registered_count' => fn($q) => $q->where('status', 'registered')]);

        try {
            app(AdminNotificationService::class)->notifyEventCreated($event);
        } catch (Throwable) {
            // Admin notification delivery must not undo a successful event creation.
        }

        return response()->json($event, 201);
    }

    // FR-05 — Organizer updates their own event.
    public function update(Request $request, Event $event): JsonResponse
    {
        $event->refreshCompletionStatus();

        if ($event->organizer_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($event->status === Event::STATUS_COMPLETED) {
            return response()->json(['message' => 'Completed events can no longer be edited.'], 422);
        }

        $data = $request->validate([
            'title'            => ['sometimes', 'string', 'max:100'],
            'description'      => ['nullable', 'string', 'max:1000'],
            'venue'            => ['sometimes', 'string', 'max:255'],
            'event_date'       => ['sometimes', 'date', 'after:now'],
            'capacity'         => ['sometimes', 'integer', 'min:1'],
            'status'           => ['sometimes', 'in:open,cancelled'],
            'cover_image_path' => ['nullable', 'string', 'max:255'],
        ]);

        $title  = $data['title'] ?? $event->title;
        $status = $data['status'] ?? $event->status;

        if ($status === 'open' && $this->hasDuplicateTitle($request->user()->id, $title, excludeEventId: $event->id)) {
            return response()->json(['message' => 'You already have an active event with this title.'], 422);
        }

        if (array_key_exists('capacity', $data)) {
            $activeRegistrations = $event->registrations()
                ->where('status', 'registered')
                ->count();

            if ($data['capacity'] < $activeRegistrations) {
                return response()->json([
                    'message' => 'Capacity cannot be lower than the current number of active registrations.',
                ], 422);
            }
        }

        $event->update($data);
        $event->load('organizer:id,name')
            ->loadCount(['registrations as registered_count' => fn($q) => $q->where('status', 'registered')]);

        return response()->json($event);
    }

    // Cancels the event by setting status to cancelled.
    public function destroy(Request $request, Event $event): JsonResponse
    {
        $event->refreshCompletionStatus();

        if ($event->organizer_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($event->status === Event::STATUS_COMPLETED) {
            return response()->json(['message' => 'Completed events cannot be cancelled.'], 422);
        }

        $registrationsToNotify = DB::transaction(function () use ($event) {
            $registrations = $event->registrations()
                ->where('status', 'registered')
                ->with('user')
                ->get();

            $event->update(['status' => Event::STATUS_CANCELLED]);

            $event->registrations()
                ->where('status', 'registered')
                ->update(['status' => 'cancelled']);

            return $registrations;
        });

        foreach ($registrationsToNotify as $registration) {
            try {
                $registration->user->notify(new RegistrationStatusNotification($event, 'cancelled'));
            } catch (Throwable) {
                // Notification delivery must not undo a successful event cancellation.
            }
        }

        try {
            app(OrganizerNotificationService::class)->notifyCancellationSummary($event, $registrationsToNotify->count());
            app(AdminNotificationService::class)->notifyEventCancellationSummary($event, $registrationsToNotify->count());
        } catch (Throwable) {
            // Summary notification should not undo a successful event cancellation.
        }

        return response()->json(['message' => 'Event cancelled.']);
    }

    // FR-05 — An organizer may not have two active (non-cancelled) events sharing
    // a title, case-insensitively. Cancelling an event frees its title for reuse.
    private function hasDuplicateTitle(int $organizerId, string $title, ?int $excludeEventId = null): bool
    {
        return Event::where('organizer_id', $organizerId)
            ->where('status', Event::STATUS_OPEN)
            ->when($excludeEventId, fn($q) => $q->where('id', '!=', $excludeEventId))
            ->whereRaw('LOWER(title) = ?', [mb_strtolower(trim($title))])
            ->exists();
    }
}
