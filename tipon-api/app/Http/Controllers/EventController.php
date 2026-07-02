<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EventController extends Controller
{
    // FR-06 — All authenticated users can browse events.
    public function index(): JsonResponse
    {
        $events = Event::with('organizer:id,name')
            ->withCount(['registrations as registered_count' => fn($q) => $q->where('status', 'registered')])
            ->get();

        return response()->json($events);
    }

    public function show(Event $event): JsonResponse
    {
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

        $event = $request->user()->organizedEvents()->create($data);

        return response()->json($event->load('organizer:id,name'), 201);
    }

    // FR-05 — Organizer updates their own event.
    public function update(Request $request, Event $event): JsonResponse
    {
        if ($event->organizer_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
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

        $event->update($data);

        return response()->json($event->load('organizer:id,name'));
    }

    // Cancels the event by setting status to cancelled.
    public function destroy(Request $request, Event $event): JsonResponse
    {
        if ($event->organizer_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $event->update(['status' => 'cancelled']);

        return response()->json(['message' => 'Event cancelled.']);
    }

    // FR-05 — An organizer may not have two active (non-cancelled) events sharing
    // a title, case-insensitively. Cancelling an event frees its title for reuse.
    private function hasDuplicateTitle(int $organizerId, string $title, ?int $excludeEventId = null): bool
    {
        return Event::where('organizer_id', $organizerId)
            ->where('status', 'open')
            ->when($excludeEventId, fn($q) => $q->where('id', '!=', $excludeEventId))
            ->whereRaw('LOWER(title) = ?', [mb_strtolower(trim($title))])
            ->exists();
    }
}
