<?php

namespace Tests\Feature\Database;

use App\Models\Event;
use App\Models\Registration;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConstraintTest extends TestCase
{
    use RefreshDatabase;

    public function test_database_blocks_duplicate_active_registrations(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();

        Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);

        $this->expectException(QueryException::class);

        Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);
    }

    public function test_database_allows_reregistration_after_cancelled_registration(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);
        $event = $this->createEvent();

        Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'cancelled',
        ]);

        Registration::create([
            'event_id' => $event->id,
            'user_id' => $participant->id,
            'status' => 'registered',
        ]);

        $this->assertSame(2, Registration::where('event_id', $event->id)->where('user_id', $participant->id)->count());
    }

    public function test_database_blocks_duplicate_open_event_title_for_same_organizer_case_insensitively(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        $this->createEvent($organizer, title: 'Database Fair');

        $this->expectException(QueryException::class);

        $this->createEvent($organizer, title: 'database fair');
    }

    public function test_database_allows_reusing_cancelled_event_title(): void
    {
        $organizer = User::factory()->create(['role' => 'organizer']);

        $this->createEvent($organizer, title: 'Reusable Database Title', status: Event::STATUS_CANCELLED);
        $this->createEvent($organizer, title: 'Reusable Database Title');

        $this->assertSame(2, Event::where('organizer_id', $organizer->id)->where('title', 'Reusable Database Title')->count());
    }

    public function test_event_must_belong_to_existing_organizer(): void
    {
        $this->expectException(QueryException::class);

        Event::create([
            'organizer_id' => 999999,
            'title' => 'Missing Organizer Event',
            'description' => 'Invalid FK test.',
            'venue' => 'Testing Hall',
            'event_date' => now()->addWeek(),
            'capacity' => 20,
            'status' => Event::STATUS_OPEN,
        ]);
    }

    public function test_registration_must_belong_to_existing_event_and_user(): void
    {
        $this->expectException(QueryException::class);

        Registration::create([
            'event_id' => 999999,
            'user_id' => 999999,
            'status' => 'registered',
        ]);
    }

    private function createEvent(?User $organizer = null, string $title = 'Database Constraint Event', string $status = Event::STATUS_OPEN): Event
    {
        $organizer ??= User::factory()->create(['role' => 'organizer']);

        return Event::create([
            'organizer_id' => $organizer->id,
            'title' => $title,
            'description' => 'Used by database constraint tests.',
            'venue' => 'Testing Hall',
            'event_date' => now()->addWeek(),
            'capacity' => 20,
            'status' => $status,
        ]);
    }
}
