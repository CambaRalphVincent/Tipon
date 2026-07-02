<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'admin@tipon.com'],
            [
                'name'              => 'System Admin',
                'password'          => 'password',
                'role'              => 'admin',
                'email_verified_at' => now(),
            ]
        );
    }
}
