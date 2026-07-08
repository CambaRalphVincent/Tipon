<?php

namespace Tests\Feature\Events;

use App\Models\Event;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_title_is_required(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/events', [
            'venue' => 'Main Hall',
            'event_date' => now()->addWeek()->toISOString(),
            'capacity' => 30,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('title');
    }

    public function test_event_title_cannot_exceed_100_characters(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/events', $this->eventPayload([
            'title' => str_repeat('A', 101),
        ]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('title');
    }

    public function test_event_description_cannot_exceed_1000_characters(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/events', $this->eventPayload([
            'description' => str_repeat('B', 1001),
        ]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('description');
    }

    public function test_event_venue_cannot_exceed_255_characters(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/events', $this->eventPayload([
            'venue' => str_repeat('V', 256),
        ]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('venue');
    }

    public function test_event_date_must_be_in_the_future(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/events', $this->eventPayload([
            'event_date' => now()->subMinute()->toISOString(),
        ]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('event_date');

        $this->assertDatabaseMissing('events', [
            'organizer_id' => $organizer->id,
            'title' => 'Validated Event',
        ]);
    }

    public function test_event_capacity_must_be_at_least_one(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/events', $this->eventPayload([
            'capacity' => 0,
        ]));

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('capacity');
    }

    public function test_cancelled_event_title_can_be_reused_by_same_organizer(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'Reusable Title',
            'description' => 'The original cancelled event.',
            'venue' => 'Old Venue',
            'event_date' => now()->addWeek(),
            'capacity' => 20,
            'status' => Event::STATUS_CANCELLED,
        ]);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/events', $this->eventPayload([
            'title' => 'Reusable Title',
        ]));

        $response
            ->assertCreated()
            ->assertJsonPath('title', 'Reusable Title')
            ->assertJsonPath('status', Event::STATUS_OPEN);

        $this->assertSame(2, Event::where('organizer_id', $organizer->id)->where('title', 'Reusable Title')->count());
    }

    public function test_event_update_rejects_invalid_status(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $event = Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'Status Validation Event',
            'description' => 'A valid event description.',
            'venue' => 'Main Hall',
            'event_date' => now()->addWeek(),
            'capacity' => 30,
            'status' => Event::STATUS_OPEN,
        ]);

        Sanctum::actingAs($organizer);

        $response = $this->putJson("/api/events/{$event->id}", [
            'status' => 'archived',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('status');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => Event::STATUS_OPEN,
        ]);
    }

    private function eventPayload(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Validated Event',
            'description' => 'A valid event description.',
            'venue' => 'Main Hall',
            'event_date' => now()->addWeek()->toISOString(),
            'capacity' => 30,
        ], $overrides);
    }
}
