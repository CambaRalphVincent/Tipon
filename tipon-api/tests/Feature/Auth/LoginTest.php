<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_verified_user_can_login_and_receive_token(): void
    {
        $user = User::factory()->create([
            'email' => 'known@example.com',
            'password' => 'Password1!',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => ' known@example.com ',
            'password' => 'Password1!',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token']);
    }

    public function test_login_normalizes_email_before_authentication(): void
    {
        $user = User::factory()->create([
            'email' => 'normalized@example.com',
            'password' => 'Password1!',
            'email_verified_at' => now(),
        ]);

        $response = $this->postJson('/api/login', [
            'email' => ' Normalized@Example.com ',
            'password' => 'Password1!',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonStructure(['token']);
    }

    public function test_login_returns_helpful_message_when_email_is_not_registered(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'missing@example.com',
            'password' => 'password',
        ]);

        $response
            ->assertNotFound()
            ->assertJson([
                'message' => 'No account found for that email. Please create an account first.',
            ]);
    }

    public function test_login_still_returns_invalid_credentials_for_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'known@example.com',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'known@example.com',
            'password' => 'wrong-password',
        ]);

        $response
            ->assertUnauthorized()
            ->assertJson([
                'message' => 'Invalid credentials.',
            ]);
    }

    public function test_unverified_user_cannot_login_until_email_is_verified(): void
    {
        User::factory()->unverified()->create([
            'email' => 'unverified@example.com',
            'password' => 'Password1!',
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'unverified@example.com',
            'password' => 'Password1!',
        ]);

        $response
            ->assertForbidden()
            ->assertJson([
                'requires_verification' => true,
                'email' => 'unverified@example.com',
            ]);
    }
}
