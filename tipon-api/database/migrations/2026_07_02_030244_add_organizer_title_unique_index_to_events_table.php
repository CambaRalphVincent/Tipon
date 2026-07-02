<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Prevent an organizer from having two active (non-cancelled) events with
        // the same title (case-insensitive). A cancelled event's title frees up.
        DB::statement("
            CREATE UNIQUE INDEX events_organizer_title_unique
            ON events (organizer_id, LOWER(title))
            WHERE status = 'open'
        ");
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS events_organizer_title_unique');
    }
};
