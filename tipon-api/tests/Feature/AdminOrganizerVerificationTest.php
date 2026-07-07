<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\EmailVerificationOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminOrganizerVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_created_organizer_requires_email_verification(): void
    {
        Notification::fake();

        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/organizers', [
            'name' => 'New Organizer',
            'email' => ' New.Organizer@Example.com ',
            'password' => 'StrongPass1!',
        ]);

        $response->assertCreated();

        $organizer = User::where('email', 'new.organizer@example.com')->firstOrFail();

        $this->assertSame('organizer', $organizer->role);
        $this->assertNull($organizer->email_verified_at);
        $this->assertNotNull($organizer->email_verification_code);
        $this->assertNotNull($organizer->email_verification_code_expires_at);

        Notification::assertSentTo($organizer, EmailVerificationOtpNotification::class);

        $loginResponse = $this->postJson('/api/login', [
            'email' => ' New.Organizer@Example.com ',
            'password' => 'StrongPass1!',
        ]);

        $loginResponse
            ->assertForbidden()
            ->assertJson([
                'requires_verification' => true,
                'email' => 'new.organizer@example.com',
            ]);
    }

    public function test_promoted_participant_keeps_existing_email_verification(): void
    {
        Notification::fake();

        $admin = User::factory()->create([
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
        $participant = User::factory()->create([
            'role' => 'participant',
            'email_verified_at' => now(),
        ]);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/admin/users/{$participant->id}/promote");

        $response->assertOk();

        $participant->refresh();

        $this->assertSame('organizer', $participant->role);
        $this->assertNotNull($participant->email_verified_at);

        Notification::assertNothingSent();
    }
}
