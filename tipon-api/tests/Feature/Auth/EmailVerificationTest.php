<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Notifications\EmailVerificationOtpNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_verification_code_verifies_user_and_returns_token(): void
    {
        $user = User::factory()->unverified()->create([
            'email' => 'verify@example.com',
            'email_verification_code' => Hash::make('123456'),
            'email_verification_code_expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/email/verify', [
            'email' => ' verify@example.com ',
            'code' => '123456',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token']);

        $user->refresh();

        $this->assertNotNull($user->email_verified_at);
        $this->assertNull($user->email_verification_code);
        $this->assertNull($user->email_verification_code_expires_at);
    }

    public function test_expired_verification_code_is_rejected(): void
    {
        User::factory()->unverified()->create([
            'email' => 'expired@example.com',
            'email_verification_code' => Hash::make('123456'),
            'email_verification_code_expires_at' => now()->subMinute(),
        ]);

        $response = $this->postJson('/api/email/verify', [
            'email' => 'expired@example.com',
            'code' => '123456',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Verification code expired. Please request a new one.');

        $this->assertDatabaseHas('users', [
            'email' => 'expired@example.com',
            'email_verified_at' => null,
        ]);
    }

    public function test_invalid_verification_code_is_rejected(): void
    {
        User::factory()->unverified()->create([
            'email' => 'invalid-code@example.com',
            'email_verification_code' => Hash::make('123456'),
            'email_verification_code_expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->postJson('/api/email/verify', [
            'email' => 'invalid-code@example.com',
            'code' => '654321',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Invalid verification code.');
    }

    public function test_verification_code_must_be_exactly_six_characters(): void
    {
        $response = $this->postJson('/api/email/verify', [
            'email' => 'verify@example.com',
            'code' => '12345',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors('code');
    }

    public function test_resend_verification_code_fails_for_unknown_email(): void
    {
        $response = $this
            ->withServerVariables(['REMOTE_ADDR' => '10.0.0.10'])
            ->postJson('/api/email/resend', [
                'email' => 'missing@example.com',
            ]);

        $response
            ->assertNotFound()
            ->assertJsonPath('message', 'No account found for that email.');
    }

    public function test_resend_verification_code_fails_for_already_verified_email(): void
    {
        User::factory()->create([
            'email' => 'verified@example.com',
            'email_verified_at' => now(),
        ]);

        $response = $this
            ->withServerVariables(['REMOTE_ADDR' => '10.0.0.11'])
            ->postJson('/api/email/resend', [
                'email' => 'verified@example.com',
            ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('message', 'Email already verified.');
    }

    public function test_resend_verification_code_creates_new_code_for_unverified_user(): void
    {
        Notification::fake();

        $user = User::factory()->unverified()->create([
            'email' => 'resend@example.com',
            'email_verification_code' => Hash::make('111111'),
            'email_verification_code_expires_at' => now()->subMinute(),
        ]);
        $oldCodeHash = $user->email_verification_code;

        $response = $this
            ->withServerVariables(['REMOTE_ADDR' => '10.0.0.12'])
            ->postJson('/api/email/resend', [
                'email' => ' resend@example.com ',
            ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Verification code resent.');

        $user->refresh();

        $this->assertNotSame($oldCodeHash, $user->email_verification_code);
        $this->assertNotNull($user->email_verification_code_expires_at);
        $this->assertTrue($user->email_verification_code_expires_at->isFuture());

        Notification::assertSentTo($user, EmailVerificationOtpNotification::class);
    }

    public function test_resend_verification_code_is_rate_limited(): void
    {
        Notification::fake();

        User::factory()->unverified()->create([
            'email' => 'limited@example.com',
            'email_verification_code' => Hash::make('111111'),
            'email_verification_code_expires_at' => now()->addMinutes(10),
        ]);

        for ($i = 0; $i < 3; $i++) {
            $this
                ->withServerVariables(['REMOTE_ADDR' => '10.0.0.99'])
                ->postJson('/api/email/resend', ['email' => 'limited@example.com'])
                ->assertOk();
        }

        $this
            ->withServerVariables(['REMOTE_ADDR' => '10.0.0.99'])
            ->postJson('/api/email/resend', ['email' => 'limited@example.com'])
            ->assertTooManyRequests();
    }
}
