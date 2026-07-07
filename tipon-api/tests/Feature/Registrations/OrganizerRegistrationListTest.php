<?php

namespace Tests\Feature\Registrations;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrganizerRegistrationListTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_registrant_list_returns_only_active_registered_users_with_user_details(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $activeParticipant = User::factory()->create([
            'role' => 'participant',
            'name' => 'Active Participant',
            'email' => 'active@example.com',
        ]);
        $cancelledParticipant = User::factory()->create([
            'role' => 'participant',
            'name' => 'Cancelled Participant',
            'email' => 'cancelled@example.com',
        ]);
        $event = $this->createEvent($organizer, title: 'Registrant List Event');

        Registration::create([
            'event_id' => $event->id,
            'user_id' => $activeParticipant->id,
            'status' => 'registered',
        ]);
        Registration::create([
            'event_id' => $event->id,
            'user_id' => $cancelledParticipant->id,
            'status' => 'cancelled',
        ]);

        Sanctum::actingAs($organizer);

        $this->getJson("/api/events/{$event->id}/registrations")
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.status', 'registered')
            ->assertJsonPath('0.user.id', $activeParticipant->id)
            ->assertJsonPath('0.user.name', 'Active Participant')
            ->assertJsonPath('0.user.email', 'active@example.com');
    }

    public function test_organizer_cannot_view_registrants_for_another_organizers_event(): void
    {
        $owner = User::factory()->create(['role' => 'organizer']);
        $otherOrganizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent($owner);
        $registration = $this->createRegistration($event);

        Sanctum::actingAs($otherOrganizer);

        $this->getJson("/api/events/{$event->id}/registrations")
            ->assertForbidden();

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'registered',
        ]);
    }

    public function test_organizer_all_registrations_only_returns_their_events_and_keeps_cancelled_history(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $otherOrganizer = User::factory()->create(['role' => 'organizer']);
        $ownEvent = $this->createEvent($organizer, title: 'Own Event');
        $otherEvent = $this->createEvent($otherOrganizer, title: 'Other Event');

        $activeRegistration = $this->createRegistration($ownEvent, status: 'registered');
        $cancelledRegistration = $this->createRegistration($ownEvent, status: 'cancelled');
        $otherRegistration = $this->createRegistration($otherEvent, status: 'registered');

        Sanctum::actingAs($organizer);

        $response = $this->getJson('/api/organizer/registrations')
            ->assertOk()
            ->assertJsonCount(2);

        $ids = array_column($response->json(), 'id');
        $statuses = array_column($response->json(), 'status');
        $eventTitles = array_column(array_column($response->json(), 'event'), 'title');

        $this->assertContains($activeRegistration->id, $ids);
        $this->assertContains($cancelledRegistration->id, $ids);
        $this->assertNotContains($otherRegistration->id, $ids);
        $this->assertContains('registered', $statuses);
        $this->assertContains('cancelled', $statuses);
        $this->assertSame(['Own Event', 'Own Event'], $eventTitles);
    }

    private function createEvent(User $organizer, string $title = 'Organizer Registration Event'): Event
    {
        return Event::create([
            'organizer_id' => $organizer->id,
            'title' => $title,
            'description' => 'Used by organizer registration list tests.',
            'venue' => 'Testing Hall',
            'event_date' => now()->addWeek(),
            'capacity' => 30,
            'status' => Event::STATUS_OPEN,
        ]);
    }

    private function createRegistration(Event $event, string $status = 'registered'): Registration
    {
        $participant = User::factory()->create(['role' => 'participant']);

        return Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => $status,
        ]);
    }
}
