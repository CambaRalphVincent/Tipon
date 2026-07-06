<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE events MODIFY status ENUM('open', 'cancelled', 'completed') NOT NULL DEFAULT 'open'");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check');
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('open', 'cancelled', 'completed'))");
        }
    }

    public function down(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("UPDATE events SET status = 'open' WHERE status = 'completed'");
            DB::statement("ALTER TABLE events MODIFY status ENUM('open', 'cancelled') NOT NULL DEFAULT 'open'");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("UPDATE events SET status = 'open' WHERE status = 'completed'");
            DB::statement('ALTER TABLE events DROP CONSTRAINT IF EXISTS events_status_check');
            DB::statement("ALTER TABLE events ADD CONSTRAINT events_status_check CHECK (status IN ('open', 'cancelled'))");
        }
    }
};
