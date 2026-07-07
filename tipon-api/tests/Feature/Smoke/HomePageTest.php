<?php

namespace Tests\Feature\Smoke;

use Tests\TestCase;

class HomePageTest extends TestCase
{
    public function test_home_page_returns_successful_response(): void
    {
        $response = $this->get('/');

        $response->assertStatus(200);
    }
}
