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
            'title'            => ['required', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'venue'            => ['required', 'string', 'max:255'],
            'event_date'       => ['required', 'date', 'after:now'],
            'capacity'         => ['required', 'integer', 'min:1'],
            'cover_image_path' => ['nullable', 'string', 'max:255'],
        ]);

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
            'title'            => ['sometimes', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'venue'            => ['sometimes', 'string', 'max:255'],
            'event_date'       => ['sometimes', 'date', 'after:now'],
            'capacity'         => ['sometimes', 'integer', 'min:1'],
            'status'           => ['sometimes', 'in:open,cancelled'],
            'cover_image_path' => ['nullable', 'string', 'max:255'],
        ]);

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
}
