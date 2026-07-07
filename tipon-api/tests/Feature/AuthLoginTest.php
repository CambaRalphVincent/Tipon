<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

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
}
