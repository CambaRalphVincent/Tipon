<?php

namespace Tests\Feature\Notifications;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use App\Notifications\RegistrationStatusNotification;
use Illuminate\Contracts\Notifications\Dispatcher as NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\Sanctum;
use Mockery\MockInterface;
use RuntimeException;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_and_mark_their_own_notification_as_read(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();

        Sanctum::actingAs($participant);

        $this->postJson("/api/events/{$event->id}/registrations")->assertCreated();

        $listResponse = $this->getJson('/api/notifications');

        $listResponse
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.data.status', 'registered')
            ->assertJsonPath('0.read_at', null);

        $notificationId = $listResponse->json('0.id');

        $this->putJson("/api/notifications/{$notificationId}/read")
            ->assertOk()
            ->assertJsonPath('message', 'Notification marked as read.');

        $this->assertDatabaseMissing('notifications', [
            'id' => $notificationId,
            'read_at' => null,
        ]);
    }

    public function test_organizer_receives_notification_when_participant_registers(): void
    {
        $participant = User::factory()->create([
            'role' => 'participant',
            'name' => 'Aisha Tan',
        ]);
        $event = $this->createEvent(title: 'Organizer Bell Event');

        Sanctum::actingAs($participant);

        $this->postJson("/api/events/{$event->id}/registrations")->assertCreated();

        Sanctum::actingAs($event->organizer);

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.notifiable_id', $event->organizer_id)
            ->assertJsonPath('0.data.audience', 'organizer')
            ->assertJsonPath('0.data.status', 'registered')
            ->assertJsonPath('0.data.participant_name', 'Aisha Tan')
            ->assertJsonPath('0.data.message', 'Aisha Tan registered for Organizer Bell Event.');
    }

    public function test_organizer_receives_notification_when_participant_cancels(): void
    {
        $participant = User::factory()->create([
            'role' => 'participant',
            'name' => 'Liam Ortega',
        ]);
        $event = $this->createEvent(title: 'Organizer Cancellation Event');

        Sanctum::actingAs($participant);

        $registrationId = $this->postJson("/api/events/{$event->id}/registrations")
            ->assertCreated()
            ->json('id');

        $this->deleteJson("/api/registrations/{$registrationId}")->assertOk();

        Sanctum::actingAs($event->organizer);

        $response = $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(2);

        $statuses = array_column(array_column($response->json(), 'data'), 'status');
        $messages = array_column(array_column($response->json(), 'data'), 'message');

        $this->assertContains('registered', $statuses);
        $this->assertContains('cancelled', $statuses);
        $this->assertContains('Liam Ortega cancelled their registration for Organizer Cancellation Event.', $messages);
    }

    public function test_organizer_receives_capacity_threshold_notification_once(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(title: 'Nearly Full Event', capacity: 10);

        $this->createRegisteredParticipants($event, 8);

        Sanctum::actingAs($participant);

        $this->postJson("/api/events/{$event->id}/registrations")->assertCreated();

        Sanctum::actingAs($event->organizer);

        $response = $this->getJson('/api/notifications')->assertOk();
        $kinds = array_column(array_column($response->json(), 'data'), 'kind');

        $this->assertContains('capacity_threshold', $kinds);
        $this->assertSame(1, collect($kinds)->filter(fn ($kind) => $kind === 'capacity_threshold')->count());

        $this->getJson('/api/notifications')->assertOk();

        $this->assertSame(
            1,
            $event->organizer->fresh()->notifications()
                ->get()
                ->filter(fn ($notification) => ($notification->data['kind'] ?? null) === 'capacity_threshold')
                ->count(),
        );
    }

    public function test_organizer_receives_event_full_notification(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(title: 'Full Event', capacity: 2);

        $this->createRegisteredParticipants($event, 1);

        Sanctum::actingAs($participant);

        $this->postJson("/api/events/{$event->id}/registrations")->assertCreated();

        Sanctum::actingAs($event->organizer);

        $response = $this->getJson('/api/notifications')->assertOk();
        $data = collect(array_column($response->json(), 'data'));
        $fullNotification = $data->first(fn ($payload) => ($payload['kind'] ?? null) === 'event_full');

        $this->assertNotNull($fullNotification);
        $this->assertSame('Event is full', $fullNotification['title']);
        $this->assertSame('/organizer/events/'.$event->id, $fullNotification['action_url']);
        $this->assertSame(2, $fullNotification['registered_count']);
        $this->assertSame(2, $fullNotification['capacity']);
    }

    public function test_organizer_notification_list_creates_upcoming_event_reminder_once(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-09 08:00:00', 'Asia/Manila'));

        try {
            $organizer = User::factory()->create(['role' => 'organizer']);
            $event = $this->createEvent(
                title: 'Tomorrow Event',
                organizer: $organizer,
                eventDate: Carbon::parse('2026-07-09 20:00:00', 'Asia/Manila'),
            );

            Sanctum::actingAs($organizer);

            $this->getJson('/api/notifications')
                ->assertOk()
                ->assertJsonCount(1)
                ->assertJsonPath('0.data.kind', 'upcoming_event_reminder')
                ->assertJsonPath('0.data.action_url', '/organizer/events/'.$event->id);

            $this->getJson('/api/notifications')->assertOk()->assertJsonCount(1);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_organizer_notification_list_creates_attendance_reminder_once(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-07-09 08:00:00', 'Asia/Manila'));

        try {
            $organizer = User::factory()->create(['role' => 'organizer']);
            $event = $this->createEvent(
                title: 'Needs Attendance Event',
                organizer: $organizer,
                eventDate: Carbon::parse('2026-07-08 08:00:00', 'Asia/Manila'),
            );
            $this->createRegisteredParticipants($event, 2);

            Sanctum::actingAs($organizer);

            $this->getJson('/api/notifications')
                ->assertOk()
                ->assertJsonCount(1)
                ->assertJsonPath('0.data.kind', 'attendance_reminder')
                ->assertJsonPath('0.data.pending_attendance_count', 2)
                ->assertJsonPath('0.data.action_url', '/organizer/events/'.$event->id);

            $this->getJson('/api/notifications')->assertOk()->assertJsonCount(1);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_user_cannot_mark_another_users_notification_as_read(): void
    {
        $owner = User::factory()->create(['role' => 'participant']);
        $stranger = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();

        Sanctum::actingAs($owner);
        $this->postJson("/api/events/{$event->id}/registrations")->assertCreated();

        $notificationId = $this->getJson('/api/notifications')->json('0.id');

        Sanctum::actingAs($stranger);

        $this->putJson("/api/notifications/{$notificationId}/read")
            ->assertNotFound();
    }

    public function test_registration_notification_contains_expected_payload(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(title: 'Payload Test Event');

        Sanctum::actingAs($participant);

        $this->postJson("/api/events/{$event->id}/registrations")->assertCreated();

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonPath('0.data.event_id', $event->id)
            ->assertJsonPath('0.data.event_title', 'Payload Test Event')
            ->assertJsonPath('0.data.status', 'registered')
            ->assertJsonPath('0.data.message', 'You have successfully registered for Payload Test Event.');
    }

    public function test_cancelling_registration_creates_cancellation_notification(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(title: 'Cancellation Payload Event');

        Sanctum::actingAs($participant);

        $registrationId = $this->postJson("/api/events/{$event->id}/registrations")
            ->assertCreated()
            ->json('id');

        $this->deleteJson("/api/registrations/{$registrationId}")->assertOk();

        $response = $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(2);

        $statuses = array_column(array_column($response->json(), 'data'), 'status');
        $messages = array_column(array_column($response->json(), 'data'), 'message');

        $this->assertContains('registered', $statuses);
        $this->assertContains('cancelled', $statuses);
        $this->assertContains('Your registration for Cancellation Payload Event has been cancelled.', $messages);
    }

    public function test_registration_still_succeeds_when_notification_delivery_fails(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(title: 'Notification Failure Registration Event');

        $this->makeNotificationDeliveryFail();

        Sanctum::actingAs($participant);

        $this->postJson("/api/events/{$event->id}/registrations")
            ->assertCreated()
            ->assertJsonPath('event_id', $event->id)
            ->assertJsonPath('user_id', $participant->id)
            ->assertJsonPath('status', 'registered');

        $this->assertDatabaseHas('registrations', [
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);
    }

    public function test_cancellation_still_succeeds_when_notification_delivery_fails(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent(title: 'Notification Failure Cancellation Event');

        Sanctum::actingAs($participant);

        $registrationId = $this->postJson("/api/events/{$event->id}/registrations")
            ->assertCreated()
            ->json('id');

        $this->makeNotificationDeliveryFail();

        $this->deleteJson("/api/registrations/{$registrationId}")
            ->assertOk()
            ->assertJsonPath('message', 'Registration cancelled.');

        $this->assertDatabaseHas('registrations', [
            'id' => $registrationId,
            'status' => 'cancelled',
        ]);
    }

    public function test_notification_list_only_returns_current_users_notifications(): void
    {
        $currentUser = User::factory()->create(['role' => 'participant']);
        $otherUser = User::factory()->create(['role' => 'participant']);
        $currentEvent = $this->createEvent(title: 'Current User Event');
        $otherEvent = $this->createEvent(title: 'Other User Event');

        $currentUser->notify(new RegistrationStatusNotification($currentEvent, 'registered'));
        $otherUser->notify(new RegistrationStatusNotification($otherEvent, 'registered'));

        Sanctum::actingAs($currentUser);

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.notifiable_id', $currentUser->id)
            ->assertJsonPath('0.data.event_title', 'Current User Event');
    }

    public function test_notifications_are_returned_newest_first(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $olderEvent = $this->createEvent(title: 'Older Event');
        $newerEvent = $this->createEvent(title: 'Newer Event');

        $participant->notify(new RegistrationStatusNotification($olderEvent, 'registered'));
        $olderNotification = $participant->notifications()->firstOrFail();
        $olderNotification->forceFill(['created_at' => now()->subHour()])->save();

        $participant->notify(new RegistrationStatusNotification($newerEvent, 'registered'));
        $newerNotification = $participant->notifications()
            ->where('id', '!=', $olderNotification->id)
            ->firstOrFail();
        $newerNotification->forceFill(['created_at' => now()])->save();

        Sanctum::actingAs($participant);

        $this->getJson('/api/notifications')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonPath('0.id', $newerNotification->id)
            ->assertJsonPath('0.data.event_title', 'Newer Event')
            ->assertJsonPath('1.id', $olderNotification->id)
            ->assertJsonPath('1.data.event_title', 'Older Event');
    }

    private function createEvent(
        string $title = 'Design Sprint',
        int $capacity = 25,
        ?User $organizer = null,
        mixed $eventDate = null,
    ): Event
    {
        $organizer ??= User::factory()->create(['role' => 'organizer']);

        return Event::create([
            'organizer_id' => $organizer->id,
            'title' => $title,
            'description' => 'A design workshop.',
            'venue' => 'Studio 1',
            'event_date' => $eventDate ?? now()->addWeek(),
            'capacity' => $capacity,
            'status' => Event::STATUS_OPEN,
        ]);
    }

    private function createRegisteredParticipants(Event $event, int $count): void
    {
        foreach (range(1, $count) as $index) {
            Registration::create([
                'event_id' => $event->id,
                'user_id' => User::factory()->create(['role' => 'participant'])->id,
                'status' => 'registered',
            ]);
        }
    }

    private function makeNotificationDeliveryFail(): void
    {
        $this->mock(NotificationDispatcher::class, function (MockInterface $mock): void {
            $mock->shouldReceive('send')
                ->andThrow(new RuntimeException('Notification delivery failed.'));
        });
    }
}
