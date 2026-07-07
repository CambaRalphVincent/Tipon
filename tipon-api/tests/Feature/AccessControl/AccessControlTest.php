<?php

namespace Tests\Feature\AccessControl;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccessControlTest extends TestCase
{
    use RefreshDatabase;

    public function test_protected_api_routes_require_authentication(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
        $this->getJson('/api/events')->assertUnauthorized();
        $this->getJson('/api/admin/users')->assertUnauthorized();
    }

    public function test_shared_authenticated_routes_allow_all_roles(): void
    {
        $event = $this->createEvent();

        foreach ($this->roles() as $role) {
            $this->actingAsRole($role);

            $this->getJson('/api/me')->assertOk();
            $this->getJson('/api/events')->assertOk();
            $this->getJson("/api/events/{$event->id}")->assertOk();
            $this->getJson('/api/notifications')->assertOk();
        }
    }

    public function test_participant_routes_only_allow_participants(): void
    {
        $event = $this->createEvent();
        $owner = User::factory()->create(['role' => 'participant']);
        $registration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $owner->id,
            'status' => 'registered',
        ]);

        Sanctum::actingAs($owner);
        $this->getJson('/api/my-registrations')->assertOk();
        $this->deleteJson("/api/registrations/{$registration->id}")->assertOk();

        $freshParticipant = User::factory()->create(['role' => 'participant']);
        Sanctum::actingAs($freshParticipant);
        $this->postJson("/api/events/{$event->id}/registrations")->assertCreated();

        foreach (['organizer', 'admin'] as $role) {
            $this->actingAsRole($role);

            $this->getJson('/api/my-registrations')->assertForbidden();
            $this->postJson("/api/events/{$event->id}/registrations")->assertForbidden();
            $this->deleteJson("/api/registrations/{$registration->id}")->assertForbidden();
        }
    }

    public function test_organizer_routes_only_allow_organizers(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $event = $this->createEvent($organizer);
        $registration = $this->createRegistration($event);

        Sanctum::actingAs($organizer);

        $this->postJson('/api/events', $this->eventPayload('Organizer Route Event'))->assertCreated();
        $this->putJson("/api/events/{$event->id}", ['title' => 'Organizer Updated Title'])->assertOk();
        $this->getJson('/api/organizer/registrations')->assertOk();
        $this->getJson("/api/events/{$event->id}/registrations")->assertOk();
        $this->putJson("/api/registrations/{$registration->id}/attendance", ['attendance' => 'present'])->assertOk();
        $this->postJson('/api/upload', ['file' => $this->fakePngUpload()])->assertOk();
        $this->deleteJson("/api/events/{$event->id}")->assertOk();

        foreach (['participant', 'admin'] as $role) {
            $blockedEvent = $this->createEvent($organizer, title: "Blocked {$role} Event");
            $blockedRegistration = $this->createRegistration($blockedEvent);

            $this->actingAsRole($role);

            $this->postJson('/api/events', $this->eventPayload("{$role} Event"))->assertForbidden();
            $this->putJson("/api/events/{$blockedEvent->id}", ['title' => "{$role} Updated"])->assertForbidden();
            $this->deleteJson("/api/events/{$blockedEvent->id}")->assertForbidden();
            $this->getJson('/api/organizer/registrations')->assertForbidden();
            $this->getJson("/api/events/{$blockedEvent->id}/registrations")->assertForbidden();
            $this->putJson("/api/registrations/{$blockedRegistration->id}/attendance", ['attendance' => 'absent'])->assertForbidden();
            $this->postJson('/api/upload', ['file' => $this->fakePngUpload()])->assertForbidden();
        }
    }

    public function test_admin_routes_only_allow_admins(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $participant = User::factory()->create(['role' => 'participant']);

        Sanctum::actingAs($admin);

        $this->getJson('/api/admin/users')->assertOk();
        $this->postJson('/api/admin/organizers', [
            'name' => 'Access Control Organizer',
            'email' => 'access-control-organizer@example.com',
            'password' => 'StrongPass1!',
        ])->assertCreated();
        $this->putJson("/api/admin/users/{$participant->id}/promote")->assertOk();

        foreach (['participant', 'organizer'] as $role) {
            $target = User::factory()->create(['role' => 'participant']);

            $this->actingAsRole($role);

            $this->getJson('/api/admin/users')->assertForbidden();
            $this->postJson('/api/admin/organizers', [
                'name' => "Blocked {$role}",
                'email' => "blocked-{$role}@example.com",
                'password' => 'StrongPass1!',
            ])->assertForbidden();
            $this->putJson("/api/admin/users/{$target->id}/promote")->assertForbidden();
        }
    }

    private function actingAsRole(string $role): User
    {
        $user = User::factory()->create(['role' => $role]);

        Sanctum::actingAs($user);

        return $user;
    }

    private function roles(): array
    {
        return ['participant', 'organizer', 'admin'];
    }

    private function createEvent(?User $organizer = null, string $title = 'Access Control Event'): Event
    {
        $organizer ??= User::factory()->create(['role' => 'organizer']);

        return Event::create([
            'organizer_id' => $organizer->id,
            'title' => $title,
            'description' => 'Used by access-control tests.',
            'venue' => 'Testing Hall',
            'event_date' => now()->addWeek(),
            'capacity' => 30,
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
            'description' => 'Created by an access-control test.',
            'venue' => 'Testing Hall',
            'event_date' => now()->addWeek()->toISOString(),
            'capacity' => 25,
        ];
    }

    private function fakePngUpload(): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'tipon-access-control-cover-');

        file_put_contents($path, base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII='
        ));

        return new UploadedFile($path, 'cover.png', 'image/png', null, true);
    }
}
