<?php

namespace Tests\Feature\Attendance;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AttendanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_event_owner_can_mark_attendance(): void
    {
        [$organizer, $registration] = $this->createRegistrationForOrganizer();

        Sanctum::actingAs($organizer);

        $response = $this->putJson("/api/registrations/{$registration->id}/attendance", [
            'attendance' => 'present',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('attendance', 'present');

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'attendance' => 'present',
        ]);
    }

    public function test_different_organizer_cannot_mark_attendance_for_someone_elses_event(): void
    {
        [, $registration] = $this->createRegistrationForOrganizer();
        $otherOrganizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($otherOrganizer);

        $response = $this->putJson("/api/registrations/{$registration->id}/attendance", [
            'attendance' => 'absent',
        ]);

        $response->assertForbidden();

        $this->assertDatabaseHas('registrations', [
            'id' => $registration->id,
            'attendance' => 'pending',
        ]);
    }

    public function test_attendance_value_must_be_valid(): void
    {
        [$organizer, $registration] = $this->createRegistrationForOrganizer();

        Sanctum::actingAs($organizer);

        $response = $this->putJson("/api/registrations/{$registration->id}/attendance", [
            'attendance' => 'late',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('attendance');
    }

    private function createRegistrationForOrganizer(): array
    {
        $organizer = User::factory()->create(['role' => 'organizer']);
        $participant = User::factory()->create(['role' => 'participant']);
        $event = Event::create([
            'organizer_id' => $organizer->id,
            'title' => 'Research Forum',
            'description' => 'A research sharing session.',
            'venue' => 'Library Hall',
            'event_date' => now()->addWeek(),
            'capacity' => 30,
            'status' => Event::STATUS_OPEN,
        ]);
        $registration = Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);

        return [$organizer, $registration];
    }
}
