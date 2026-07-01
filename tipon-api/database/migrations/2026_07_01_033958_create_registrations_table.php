<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('event_id')->constrained('events')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->enum('status', ['registered', 'cancelled'])->default('registered');
            $table->enum('attendance', ['pending', 'present', 'absent'])->default('pending');
            $table->timestamps();
        });

        // Prevent duplicate active registrations: one participant per event at a time.
        DB::statement("
            CREATE UNIQUE INDEX registrations_event_user_unique
            ON registrations (event_id, user_id)
            WHERE status = 'registered'
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('registrations');
    }
};
