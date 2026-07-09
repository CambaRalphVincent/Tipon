<?php

namespace Tests\Feature\Events;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_organizer_can_create_an_event(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/events', [
            'title' => 'Campus Tech Summit',
            'description' => 'A student technology event.',
            'venue' => 'Main Auditorium',
            'event_date' => now()->addWeek()->toISOString(),
            'capacity' => 50,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('title', 'Campus Tech Summit')
            ->assertJsonPath('status', Event::STATUS_OPEN)
            ->assertJsonPath('registered_count', 0);

        $this->assertDatabaseHas('events', [
            'organizer_id' => $organizer->id,
            'title' => 'Campus Tech Summit',
            'status' => Event::STATUS_OPEN,
        ]);

        $adminNotification = $admin->fresh()->notifications()->firstOrFail();
        $this->assertSame('admin_event_created', $adminNotification->data['kind']);
        $this->assertSame('Campus Tech Summit', $adminNotification->data['event_title']);
        $this->assertSame($organizer->id, $adminNotification->data['organizer_id']);
        $this->assertSame('/admin/events', $adminNotification->data['action_url']);
    }

    public function test_event_date_preserves_philippines_local_time_when_created(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-07 12:00:00', 'Asia/Manila'));

        try {
            $organizer = User::factory()->create(['role' => 'organizer']);

            Sanctum::actingAs($organizer);

            $response = $this->postJson('/api/events', [
                'title' => 'Philippines Local Schedule',
                'description' => 'A timezone-sensitive event.',
                'venue' => 'Main Auditorium',
                'event_date' => '2026-07-08T15:45:00',
                'capacity' => 50,
            ]);

            $response
                ->assertCreated()
                ->assertJsonPath('event_date', '2026-07-08T15:45:00');

            $this->assertDatabaseHas('events', [
                'organizer_id' => $organizer->id,
                'title' => 'Philippines Local Schedule',
                'event_date' => '2026-07-08 15:45:00',
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_event_date_converts_legacy_utc_payloads_to_philippines_local_time(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-07 12:00:00', 'Asia/Manila'));

        try {
            $organizer = User::factory()->create(['role' => 'organizer']);

            Sanctum::actingAs($organizer);

            $response = $this->postJson('/api/events', [
                'title' => 'Legacy UTC Schedule',
                'description' => 'A timezone-sensitive event.',
                'venue' => 'Main Auditorium',
                'event_date' => '2026-07-08T07:45:00.000Z',
                'capacity' => 50,
            ]);

            $response
                ->assertCreated()
                ->assertJsonPath('event_date', '2026-07-08T15:45:00');

            $this->assertDatabaseHas('events', [
                'organizer_id' => $organizer->id,
                'title' => 'Legacy UTC Schedule',
                'event_date' => '2026-07-08 15:45:00',
            ]);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_participant_cannot_create_an_event(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);

        Sanctum::actingAs($participant);

        $response = $this->postJson('/api/events', [
            'title' => 'Unauthorized Event',
            'venue' => 'Room 101',
            'event_date' => now()->addDay()->toISOString(),
            'capacity' => 10,
        ]);

        $response->assertForbidden();

        $this->assertDatabaseMissing('events', [
            'title' => 'Unauthorized Event',
        ]);
    }

    public function test_organizer_can_update_their_own_event(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent($organizer, title: 'Original Title');

        Sanctum::actingAs($organizer);

        $response = $this->putJson("/api/events/{$event->id}", [
            'title' => 'Updated Title',
            'venue' => 'Updated Venue',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('title', 'Updated Title')
            ->assertJsonPath('venue', 'Updated Venue');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'title' => 'Updated Title',
            'venue' => 'Updated Venue',
        ]);
    }

    public function test_organizer_cannot_update_event_to_duplicate_open_title(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $existingEvent = $this->createEvent($organizer, title: 'Existing Open Event');
        $eventToUpdate = $this->createEvent($organizer, title: 'Different Open Event');

        Sanctum::actingAs($organizer);

        $response = $this->putJson("/api/events/{$eventToUpdate->id}", [
            'title' => ' existing open event ',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You already have an active event with this title.');

        $this->assertDatabaseHas('events', [
            'id' => $existingEvent->id,
            'title' => 'Existing Open Event',
        ]);
        $this->assertDatabaseHas('events', [
            'id' => $eventToUpdate->id,
            'title' => 'Different Open Event',
        ]);
    }

    public function test_organizer_can_update_event_status_to_cancelled(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent($organizer);

        Sanctum::actingAs($organizer);

        $response = $this->putJson("/api/events/{$event->id}", [
            'status' => Event::STATUS_CANCELLED,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('status', Event::STATUS_CANCELLED);

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => Event::STATUS_CANCELLED,
        ]);
    }

    public function test_organizer_cannot_reduce_capacity_below_active_registrations(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent($organizer, capacity: 5);

        foreach (range(1, 3) as $index) {
            Registration::create([
                'event_id' => $event->id,
                'user_id' => User::factory()->create(['role' => 'participant'])->id,
                'status' => 'registered',
            ]);
        }

        Sanctum::actingAs($organizer);

        $response = $this->putJson("/api/events/{$event->id}", [
            'capacity' => 2,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Capacity cannot be lower than the current number of active registrations.');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'capacity' => 5,
        ]);
    }

    public function test_organizer_cannot_update_another_organizers_event(): void
    {
        $owner = User::factory()->create(['role' => 'organizer']);
        $otherOrganizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent($owner, title: 'Owner Event');

        Sanctum::actingAs($otherOrganizer);

        $response = $this->putJson("/api/events/{$event->id}", [
            'title' => 'Hijacked Title',
        ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'title' => 'Owner Event',
        ]);
    }

    public function test_organizer_can_cancel_their_own_event(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent($organizer);

        Sanctum::actingAs($organizer);

        $response = $this->deleteJson("/api/events/{$event->id}");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Event cancelled.');

        $this->assertDatabaseHas('events', [
            'id' => $event->id,
            'status' => Event::STATUS_CANCELLED,
        ]);
    }

    public function test_event_cancellation_cancels_active_registrations_and_notifies_active_registrants(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $organizer = User::factory()->create(['role' => 'organizer']);
        $activeParticipant = User::factory()->create(['role' => 'participant']);
        $anotherActiveParticipant = User::factory()->create(['role' => 'participant']);
        $alreadyCancelledParticipant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent($organizer);

        $activeRegistration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $activeParticipant->id,
            'status' => 'registered',
        ]);
        $anotherActiveRegistration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $anotherActiveParticipant->id,
            'status' => 'registered',
        ]);
        $alreadyCancelledRegistration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $alreadyCancelledParticipant->id,
            'status' => 'cancelled',
        ]);

        Sanctum::actingAs($organizer);

        $this->deleteJson("/api/events/{$event->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Event cancelled.');

        $this->assertDatabaseHas('registrations', [
            'id' => $activeRegistration->id,
            'status' => 'cancelled',
        ]);
        $this->assertDatabaseHas('registrations', [
            'id' => $anotherActiveRegistration->id,
            'status' => 'cancelled',
        ]);
        $this->assertDatabaseHas('registrations', [
            'id' => $alreadyCancelledRegistration->id,
            'status' => 'cancelled',
        ]);

        $this->assertSame(1, $activeParticipant->fresh()->notifications()->count());
        $this->assertSame(1, $anotherActiveParticipant->fresh()->notifications()->count());
        $this->assertSame(0, $alreadyCancelledParticipant->fresh()->notifications()->count());
        $this->assertSame('cancelled', $activeParticipant->fresh()->notifications()->firstOrFail()->data['status']);

        $summary = $organizer->fresh()->notifications()->firstOrFail();
        $this->assertSame('event_cancellation_summary', $summary->data['kind']);
        $this->assertSame(2, $summary->data['affected_count']);
        $this->assertSame('/organizer/events', $summary->data['action_url']);

        $adminSummary = $admin->fresh()->notifications()->firstOrFail();
        $this->assertSame('admin_event_cancellation_summary', $adminSummary->data['kind']);
        $this->assertSame(2, $adminSummary->data['affected_count']);
        $this->assertSame('/admin/events', $adminSummary->data['action_url']);
    }

    public function test_organizer_cannot_create_duplicate_open_event_title_case_insensitively(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        $this->createEvent($organizer, title: 'Career Fair');

        Sanctum::actingAs($organizer);

        $response = $this->postJson('/api/events', [
            'title' => ' career fair ',
            'description' => 'Duplicate event.',
            'venue' => 'Hall B',
            'event_date' => now()->addDays(12)->toISOString(),
            'capacity' => 80,
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You already have an active event with this title.');

        $this->assertSame(1, Event::where('organizer_id', $organizer->id)->count());
    }

    private function createEvent(User $organizer, string $title = 'Leadership Workshop', int $capacity = 20): Event
    {
        return Event::create([
            'organizer_id' => $organizer->id,
            'title' => $title,
            'description' => 'A workshop for student leaders.',
            'venue' => 'Conference Room',
            'event_date' => now()->addWeek(),
            'capacity' => $capacity,
            'status' => Event::STATUS_OPEN,
        ]);
    }
}
