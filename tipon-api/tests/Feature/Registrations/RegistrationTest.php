<?php

namespace Tests\Feature\Registrations;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_participant_can_register_for_open_event(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(capacity: 2);

        Sanctum::actingAs($participant);

        $response = $this->postJson("/api/events/{$event->id}/registrations");

        $response
            ->assertCreated()
            ->assertJsonPath('event_id', $event->id)
            ->assertJsonPath('user_id', $participant->id)
            ->assertJsonPath('status', 'registered');

        $this->assertDatabaseHas('registrations', [
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
            'attendance' => 'pending',
        ]);

        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_organizer_cannot_register_as_participant(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent();

        Sanctum::actingAs($organizer);

        $response = $this->postJson("/api/events/{$event->id}/registrations");

        $response->assertForbidden();

        $this->assertDatabaseMissing('registrations', [
            'event_id' => $event->id,
            'user_id' => $organizer->id,
        ]);
    }

    public function test_participant_cannot_register_twice_for_same_active_event(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(capacity: 2);

        Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);

        Sanctum::actingAs($participant);

        $response = $this->postJson("/api/events/{$event->id}/registrations");

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'You are already registered for this event.');

        $this->assertSame(1, Registration::where('event_id', $event->id)->where('user_id', $participant->id)->count());
    }

    public function test_participant_cannot_register_when_event_is_full(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $alreadyRegistered = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(capacity: 1);

        Registration::create([
            'event_id' => $event->id,
            'user_id' => $alreadyRegistered->id,
            'status' => 'registered',
        ]);

        Sanctum::actingAs($participant);

        $response = $this->postJson("/api/events/{$event->id}/registrations");

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Event is at full capacity.');

        $this->assertDatabaseMissing('registrations', [
            'event_id' => $event->id,
            'user_id' => $participant->id,
        ]);
    }

    public function test_participant_cannot_register_for_cancelled_event(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(status: Event::STATUS_CANCELLED);

        Sanctum::actingAs($participant);

        $response = $this->postJson("/api/events/{$event->id}/registrations");

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Event is not open for registration.');

        $this->assertDatabaseMissing('registrations', [
            'event_id' => $event->id,
            'user_id' => $participant->id,
        ]);
    }

    public function test_participant_can_reregister_after_cancelling_when_capacity_is_available(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(capacity: 1);

        Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);

        Sanctum::actingAs($participant);

        $response = $this->postJson("/api/events/{$event->id}/registrations");

        $response
            ->assertCreated()
            ->assertJsonPath('status', 'registered');

        $this->assertDatabaseHas('registrations', [
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);
        $this->assertSame(2, Registration::where('event_id', $event->id)->where('user_id', $participant->id)->count());
    }

    public function test_cancelled_registrations_do_not_count_toward_capacity(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $cancelledParticipant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(capacity: 1);

        Registration::create([
            'event_id' => $event->id,
            'user_id' => $cancelledParticipant->id,
            'status' => 'cancelled',
        ]);

        Sanctum::actingAs($participant);

        $this->postJson("/api/events/{$event->id}/registrations")
            ->assertCreated();

        $this->assertDatabaseHas('registrations', [
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);
    }

    public function test_participant_can_cancel_their_own_registration(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();
        $registration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);

        Sanctum::actingAs($participant);

        $response = $this->deleteJson("/api/registrations/{$registration->id}");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Registration cancelled.');

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_participant_cannot_cancel_another_participants_registration(): void
    {
        $owner = User::factory()->create(['role' => 'participant']);
        $stranger = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();
        $registration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $owner->id,
            'status' => 'registered',
        ]);

        Sanctum::actingAs($stranger);

        $response = $this->deleteJson("/api/registrations/{$registration->id}");

        $response->assertForbidden();

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'registered',
        ]);
    }

    public function test_participant_cannot_cancel_an_already_cancelled_registration(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();
        $registration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);

        Sanctum::actingAs($participant);

        $response = $this->deleteJson("/api/registrations/{$registration->id}");

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Registration is already cancelled.');

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_my_registrations_includes_cancelled_history(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $activeEvent = $this->createEvent(title: 'Active Registration Event');
        $cancelledEvent = $this->createEvent(title: 'Cancelled Registration Event');

        Registration::create([
            'event_id' => $activeEvent->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);
        Registration::create([
            'event_id' => $cancelledEvent->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);

        Sanctum::actingAs($participant);

        $response = $this->getJson('/api/my-registrations')
            ->assertOk()
            ->assertJsonCount(2);

        $statuses = array_column($response->json(), 'status');

        $this->assertContains('registered', $statuses);
        $this->assertContains('cancelled', $statuses);
    }

    public function test_my_registrations_hides_cancelled_history_when_participant_is_registered_again_for_same_event(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $reregisteredEvent = $this->createEvent(title: 'Reregistered Event');
        $cancelledOnlyEvent = $this->createEvent(title: 'Cancelled Only Event');

        $supersededCancelledRegistration = Registration::create([
            'event_id' => $reregisteredEvent->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);
        $activeRegistration = Registration::create([
            'event_id' => $reregisteredEvent->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);
        $cancelledOnlyRegistration = Registration::create([
            'event_id' => $cancelledOnlyEvent->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);

        Sanctum::actingAs($participant);

        $response = $this->getJson('/api/my-registrations')
            ->assertOk()
            ->assertJsonCount(2);

        $ids = array_column($response->json(), 'id');

        $this->assertContains($activeRegistration->id, $ids);
        $this->assertContains($cancelledOnlyRegistration->id, $ids);
        $this->assertNotContains($supersededCancelledRegistration->id, $ids);
    }

    public function test_my_registrations_only_shows_latest_recent_cancelled_registration_per_event(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(title: 'Repeated Cancellation Event');

        $olderCancelledRegistration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);
        $olderCancelledRegistration->forceFill([
            'updated_at' => now()->subHours(3),
        ])->save();

        $latestCancelledRegistration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);
        $latestCancelledRegistration->forceFill([
            'updated_at' => now()->subMinutes(10),
        ])->save();

        Sanctum::actingAs($participant);

        $response = $this->getJson('/api/my-registrations')
            ->assertOk()
            ->assertJsonCount(1);

        $ids = array_column($response->json(), 'id');

        $this->assertContains($latestCancelledRegistration->id, $ids);
        $this->assertNotContains($olderCancelledRegistration->id, $ids);
    }

    public function test_my_registrations_hides_cancelled_registrations_after_one_day(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $recentCancelledEvent = $this->createEvent(title: 'Recent Cancelled Event');
        $oldCancelledEvent = $this->createEvent(title: 'Old Cancelled Event');

        $recentCancelledRegistration = Registration::create([
            'event_id' => $recentCancelledEvent->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);
        $recentCancelledRegistration->forceFill([
            'updated_at' => now()->subHours(2),
        ])->save();

        $oldCancelledRegistration = Registration::create([
            'event_id' => $oldCancelledEvent->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);
        $oldCancelledRegistration->forceFill([
            'updated_at' => now()->subDay()->subMinute(),
        ])->save();

        Sanctum::actingAs($participant);

        $response = $this->getJson('/api/my-registrations')
            ->assertOk()
            ->assertJsonCount(1);

        $ids = array_column($response->json(), 'id');

        $this->assertContains($recentCancelledRegistration->id, $ids);
        $this->assertNotContains($oldCancelledRegistration->id, $ids);
    }

    private function createEvent(int $capacity = 20, string $status = Event::STATUS_OPEN, string $title = 'Leadership Workshop'): Event
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        return Event::create([
            'organizer_id' => $organizer->id,
            'title' => $title,
            'description' => 'A workshop for student leaders.',
            'venue' => 'Conference Room',
            'event_date' => now()->addWeek(),
            'capacity' => $capacity,
            'status' => $status,
        ]);
    }
}
