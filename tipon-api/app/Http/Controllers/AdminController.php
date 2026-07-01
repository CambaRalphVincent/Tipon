<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class AdminController extends Controller
{
    // List all participants and organizers.
    public function index(): JsonResponse
    {
        $users = User::whereIn('role', ['participant', 'organizer'])
            ->orderBy('role')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role', 'created_at']);

        return response()->json($users);
    }

    // Create a new organizer account.
    public function createOrganizer(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users'],
            'password' => ['required', Password::min(8)],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => 'organizer',
        ]);

        return response()->json($user, 201);
    }

    // Promote a participant to organizer.
    public function promote(User $user): JsonResponse
    {
        if ($user->role !== 'participant') {
            return response()->json(['message' => 'User is not a participant.'], 422);
        }

        $user->update(['role' => 'organizer']);

        return response()->json($user);
    }
}
