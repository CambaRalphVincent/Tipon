<?php

namespace Tests\Feature\Events;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_past_open_events_are_marked_completed_when_events_are_loaded(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(eventDate: now()->subDay());

        Sanctum::actingAs($participant);

        $response = $this->getJson('/api/events');

        $response
            ->assertOk()
            ->assertJsonPath('0.id', $event->id)
            ->assertJsonPath('0.status', Event::STATUS_COMPLETED);

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => Event::STATUS_COMPLETED,
        ]);
    }

    public function test_participant_cannot_register_for_completed_or_past_event(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(eventDate: now()->subDay());

        Sanctum::actingAs($participant);

        $response = $this->postJson("/api/events/{$event->id}/registrations");

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Event is not open for registration.');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => Event::STATUS_COMPLETED,
        ]);
        $this->assertDatabaseMissing('registrations', [
            'event_id' => $event->id,
            'user_id' => $participant->id,
        ]);
    }

    public function test_participant_cannot_cancel_registration_after_event_date(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(eventDate: now()->subDay());
        $registration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);

        Sanctum::actingAs($participant);

        $response = $this->deleteJson("/api/registrations/{$registration->id}");

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Registration can no longer be cancelled after the event date.');

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'registered',
        ]);
        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => Event::STATUS_COMPLETED,
        ]);
    }

    public function test_organizer_cannot_edit_completed_event(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent($organizer, eventDate: now()->subDay());

        Sanctum::actingAs($organizer);

        $response = $this->putJson("/api/events/{$event->id}", [
            'title' => 'Updated After Completion',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Completed events can no longer be edited.');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'title' => 'Completion Test Event',
            'status' => Event::STATUS_COMPLETED,
        ]);
    }

    public function test_organizer_cannot_cancel_completed_event(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent($organizer, eventDate: now()->subDay());

        Sanctum::actingAs($organizer);

        $response = $this->deleteJson("/api/events/{$event->id}");

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Completed events cannot be cancelled.');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => Event::STATUS_COMPLETED,
        ]);
    }

    private function createEvent(?User $organizer = null, mixed $eventDate = null): Event
    {
        $organizer ??= User::factory()->create(['role' => 'organizer']);

        return Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'Completion Test Event',
            'description' => 'Used to test completed event behavior.',
            'venue' => 'Testing Hall',
            'event_date' => $eventDate ?? now()->addWeek(),
            'capacity' => 20,
            'status' => Event::STATUS_OPEN,
        ]);
    }
}
