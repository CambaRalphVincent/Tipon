<?php

namespace Tests\Feature\Api;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ResponseShapeTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_list_includes_registered_count(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();
        $this->createRegistration($event);

        Sanctum::actingAs($participant);

        $this->getJson('/api/events')
            ->assertOk()
            ->assertJsonPath('0.id', $event->id)
            ->assertJsonPath('0.registered_count', 1);
    }

    public function test_event_detail_includes_organizer_and_registered_count(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $organizer = User::factory()->create([
            'role' => 'organizer',
            'name' => 'Organizer Name',
        ]);
        $event = $this->createEvent($organizer);
        $this->createRegistration($event);

        Sanctum::actingAs($participant);

        $this->getJson("/api/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('id', $event->id)
            ->assertJsonPath('registered_count', 1)
            ->assertJsonPath('organizer.id', $organizer->id)
            ->assertJsonPath('organizer.name', 'Organizer Name');
    }

    public function test_event_create_and_update_responses_include_registered_count(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $createResponse = $this->postJson('/api/events', $this->eventPayload('Response Shape Event'));

        $eventId = $createResponse
            ->assertCreated()
            ->assertJsonPath('registered_count', 0)
            ->json('id');

        $this->createRegistration(Event::findOrFail($eventId));

        $this->putJson("/api/events/{$eventId}", [
            'title' => 'Updated Response Shape Event',
        ])
            ->assertOk()
            ->assertJsonPath('title', 'Updated Response Shape Event')
            ->assertJsonPath('registered_count', 1);
    }

    public function test_registration_create_response_includes_nested_event_title(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(title: 'Nested Event Title');

        Sanctum::actingAs($participant);

        $this->postJson("/api/events/{$event->id}/registrations")
            ->assertCreated()
            ->assertJsonPath('event_id', $event->id)
            ->assertJsonPath('event.id', $event->id)
            ->assertJsonPath('event.title', 'Nested Event Title');
    }

    public function test_admin_users_response_excludes_admins_and_sensitive_fields(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $participant = User::factory()->create([
            'role' => 'participant',
            'name' => 'Participant User',
        ]);
        $organizer = User::factory()->create([
            'role' => 'organizer',
            'name' => 'Organizer User',
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonCount(2);

        $ids = array_column($response->json(), 'id');

        $this->assertContains($participant->id, $ids);
        $this->assertContains($organizer->id, $ids);
        $this->assertNotContains($admin->id, $ids);

        foreach ($response->json() as $user) {
            $this->assertSame(['id', 'name', 'email', 'role', 'created_at'], array_keys($user));
        }
    }

    private function createEvent(?User $organizer = null, string $title = 'API Shape Event'): Event
    {
        $organizer ??= User::factory()->create(['role' => 'organizer']);

        return Event::create([
            'organizer_id' => $organizer->id,
            'title' => $title,
            'description' => 'Used by API response shape tests.',
            'venue' => 'Testing Hall',
            'event_date' => now()->addWeek(),
            'capacity' => 20,
            'status' => Event::STATUS_OPEN,
        ]);
    }

    private function createRegistration(Event $event): Registration
    {
        $participant = User::factory()->create(['role' => 'participant']);

        return Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);
    }

    private function eventPayload(string $title): array
    {
        return [
            'title' => $title,
            'description' => 'Created by response shape test.',
            'venue' => 'Testing Hall',
            'event_date' => now()->addWeek()->toISOString(),
            'capacity' => 25,
        ];
    }
}
