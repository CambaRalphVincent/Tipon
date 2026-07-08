<?php

namespace Tests\Feature\Livewire;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use App\Notifications\RegistrationStatusNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ParticipantEventRoutesTest extends TestCase
{
    use RefreshDatabase;

    public function test_participant_can_view_livewire_event_pages(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(title: 'Livewire Workshop');

        $this->actingAs($participant);

        $this->get('/events')
            ->assertOk()
            ->assertSee('Browse Events')
            ->assertSee('Livewire Workshop');

        $this->get("/events/{$event->id}")
            ->assertOk()
            ->assertSee('Livewire Workshop')
            ->assertSee('About this event');
    }

    public function test_organizer_and_admin_cannot_view_participant_livewire_event_pages(): void
    {
        $event = $this->createEvent();

        foreach (['organizer', 'admin'] as $role) {
            $user = User::factory()->create(['role' => $role]);

            $this->actingAs($user);

            $this->get('/events')->assertForbidden();
            $this->get("/events/{$event->id}")->assertForbidden();
        }
    }

    public function test_livewire_browse_search_query_filters_events(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);

        $this->createEvent(title: 'Cybersecurity Bootcamp', venue: 'Lab 1');
        $this->createEvent(title: 'Art History Forum', venue: 'Gallery Hall');

        $this->actingAs($participant);

        $response = $this->get('/events?q=cybersecurity');

        $response
            ->assertOk()
            ->assertSee('Cybersecurity Bootcamp')
            ->assertDontSee('Art History Forum');
    }

    public function test_livewire_browse_search_query_filters_events_by_venue(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);

        $this->createEvent(title: 'Cybersecurity Bootcamp', venue: 'Lab 1');
        $this->createEvent(title: 'Art History Forum', venue: 'Gallery Hall');

        $this->actingAs($participant);

        $response = $this->get('/events?q=gallery');

        $response
            ->assertOk()
            ->assertSee('Art History Forum')
            ->assertDontSee('Cybersecurity Bootcamp');
    }

    public function test_livewire_browse_search_query_is_case_insensitive_for_title_and_venue(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);

        $this->createEvent(title: 'Cybersecurity Bootcamp', venue: 'Lab 1');
        $this->createEvent(title: 'Art History Forum', venue: 'Gallery Hall');
        $this->createEvent(title: 'Robotics Demo Day', venue: 'Innovation Center');

        $this->actingAs($participant);

        $this->get('/events?q=CYBERSECURITY')
            ->assertOk()
            ->assertSee('Cybersecurity Bootcamp')
            ->assertDontSee('Art History Forum');

        $this->get('/events?q=gallery HALL')
            ->assertOk()
            ->assertSee('Art History Forum')
            ->assertDontSee('Robotics Demo Day');
    }

    public function test_participant_can_register_through_livewire_form_route(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();

        $this->actingAs($participant);

        $response = $this->post("/events/{$event->id}/register");

        $response
            ->assertRedirect()
            ->assertSessionHas('success', 'You have successfully registered for this event.');

        $this->assertDatabaseHas('registrations', [
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_participant_can_cancel_through_livewire_form_route(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();
        $registration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);

        $this->actingAs($participant);

        $response = $this->post("/events/{$event->id}/cancel-registration");

        $response
            ->assertRedirect()
            ->assertSessionHas('success', 'Your registration has been cancelled.');

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'status' => 'cancelled',
        ]);
        $this->assertDatabaseCount('notifications', 1);
    }

    public function test_participant_can_mark_all_livewire_notifications_as_read(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();

        $participant->notify(new RegistrationStatusNotification($event, 'registered'));
        $participant->notify(new RegistrationStatusNotification($event, 'cancelled'));

        $this->assertSame(2, $participant->unreadNotifications()->count());

        $this->actingAs($participant);

        $this->post('/notifications/read-all')
            ->assertRedirect();

        $this->assertSame(0, $participant->fresh()->unreadNotifications()->count());
    }

    public function test_participant_can_mark_one_livewire_notification_as_read(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();

        $participant->notify(new RegistrationStatusNotification($event, 'registered'));
        $notification = $participant->notifications()->firstOrFail();

        $this->actingAs($participant);

        $this->post("/notifications/{$notification->id}/read")
            ->assertRedirect();

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_participant_cannot_mark_another_users_livewire_notification_as_read(): void
    {
        $owner = User::factory()->create(['role' => 'participant']);
        $stranger = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();

        $owner->notify(new RegistrationStatusNotification($event, 'registered'));
        $notification = $owner->notifications()->firstOrFail();

        $this->actingAs($stranger);

        $this->post("/notifications/{$notification->id}/read")
            ->assertNotFound();

        $this->assertNull($notification->fresh()->read_at);
    }

    private function createEvent(string $title = 'Participant Livewire Event', string $venue = 'Testing Hall'): Event
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        return Event::create([
            'organizer_id' => $organizer->id,
            'title' => $title,
            'description' => 'A Livewire route test event.',
            'venue' => $venue,
            'event_date' => now()->addWeek(),
            'capacity' => 30,
            'status' => Event::STATUS_OPEN,
        ]);
    }
}
