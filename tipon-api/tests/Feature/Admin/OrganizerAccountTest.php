<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Notifications\EmailVerificationOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class OrganizerAccountTest extends TestCase
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

    public function test_participant_cannot_create_organizer_account(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);

        Sanctum::actingAs($participant);

        $response = $this->postJson('/api/admin/organizers', [
            'name' => 'Blocked Organizer',
            'email' => 'blocked@example.com',
            'password' => 'StrongPass1!',
        ]);

        $response->assertForbidden();

        $this->assertDatabaseMissing('users', [
            'email' => 'blocked@example.com',
        ]);
    }

    public function test_admin_created_organizer_password_must_be_strong(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/organizers', [
            'name' => 'Weak Password Organizer',
            'email' => 'weak-organizer@example.com',
            'password' => 'password',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->assertDatabaseMissing('users', [
            'email' => 'weak-organizer@example.com',
        ]);
    }

    public function test_admin_cannot_create_organizer_with_duplicate_email(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        User::factory()->create(['email' => 'existing@example.com']);

        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/admin/organizers', [
            'name' => 'Duplicate Email Organizer',
            'email' => ' existing@example.com ',
            'password' => 'StrongPass1!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_admin_created_organizer_name_and_email_are_normalized(): void
    {
        Notification::fake();

        $admin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $this->postJson('/api/admin/organizers', [
            'name' => '  Normalized Organizer  ',
            'email' => ' Normalized.Organizer@Example.com ',
            'password' => 'StrongPass1!',
        ])->assertCreated();

        $this->assertDatabaseHas('users', [
            'name' => 'Normalized Organizer',
            'email' => 'normalized.organizer@example.com',
            'role' => 'organizer',
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

    public function test_admin_cannot_promote_an_organizer_again(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $organizer = User::factory()->create(['role' => 'organizer']);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/admin/users/{$organizer->id}/promote");

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'User is not a participant.');
    }

    public function test_admin_cannot_promote_another_admin(): void
    {
        $admin = User::factory()->create(['role' => 'admin']);
        $otherAdmin = User::factory()->create(['role' => 'admin']);

        Sanctum::actingAs($admin);

        $response = $this->putJson("/api/admin/users/{$otherAdmin->id}/promote");

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'User is not a participant.');
    }
}
