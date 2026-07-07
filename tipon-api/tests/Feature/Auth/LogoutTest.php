<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\PersonalAccessToken;
use Tests\TestCase;

class LogoutTest extends TestCase
{
    use RefreshDatabase;

    public function test_me_endpoint_works_with_login_token(): void
    {
        $user = User::factory()->create([
            'email' => 'token-user@example.com',
            'password' => 'Password1!',
            'email_verified_at' => now(),
        ]);

        $token = $this->postJson('/api/login', [
            'email' => 'token-user@example.com',
            'password' => 'Password1!',
        ])
            ->assertOk()
            ->json('token');

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('id', $user->id)
            ->assertJsonPath('email', 'token-user@example.com');
    }

    public function test_api_logout_revokes_bearer_token_and_blocks_future_me_requests(): void
    {
        $user = User::factory()->create([
            'email' => 'logout-user@example.com',
            'email_verified_at' => now(),
        ]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $this->assertSame(1, PersonalAccessToken::count());

        $this->withToken($token)
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logged out successfully.');

        $this->assertSame(0, PersonalAccessToken::count());

        app('auth')->forgetGuards();

        $this->withToken($token)
            ->getJson('/api/me')
            ->assertUnauthorized();
    }

    public function test_livewire_logout_clears_session_and_redirects_to_frontend(): void
    {
        $participant = User::factory()->create(['role' => 'participant']);

        $this->actingAs($participant);

        $this->post('/logout-livewire')
            ->assertRedirect(config('app.frontend_url').'/');

        $this->assertGuest();

        $this->get('/events')
            ->assertRedirect(config('app.frontend_url').'/');
    }
}
