<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\EmailVerificationOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class RegisterTest extends TestCase
{
    use RefreshDatabase;

    public function test_participant_can_register_and_receive_verification_code(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => '  Maria Santos  ',
            'email' => ' Maria.Santos@Example.com ',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('email', 'maria.santos@example.com');

        $user = User::where('email', 'maria.santos@example.com')->firstOrFail();

        $this->assertSame('Maria Santos', $user->name);
        $this->assertSame('participant', $user->role);
        $this->assertNull($user->email_verified_at);
        $this->assertNotNull($user->email_verification_code);

        Notification::assertSentTo($user, EmailVerificationOtpNotification::class);
    }

    public function test_registration_requires_strong_confirmed_password(): void
    {
        $response = $this->postJson('/api/register', [
            'name' => 'Weak Password User',
            'email' => 'weak@example.com',
            'password' => 'password',
            'password_confirmation' => 'different',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('password');

        $this->assertDatabaseMissing('users', [
            'email' => 'weak@example.com',
        ]);
    }

    public function test_registration_rejects_duplicate_email_case_insensitively_after_normalization(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $response = $this->postJson('/api/register', [
            'name' => 'Duplicate Email User',
            'email' => ' Existing@Example.com ',
            'password' => 'StrongPass1!',
            'password_confirmation' => 'StrongPass1!',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertSame(1, User::where('email', 'existing@example.com')->count());
    }
}
