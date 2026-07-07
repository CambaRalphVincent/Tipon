<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\EmailVerificationOtpNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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

    // Create a new organizer account. Admin-created organizers still verify
    // ownership of their email before they can log in.
    public function createOrganizer(Request $request): JsonResponse
    {
        $request->merge([
            'name'  => trim((string) $request->input('name')),
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users'],
            'password' => ['required', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $user = User::create([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'password'          => $data['password'],
            'role'              => 'organizer',
        ]);

        $this->issueVerificationCode($user);

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

    private function issueVerificationCode(User $user): void
    {
        $code = (string) random_int(100000, 999999);

        $user->update([
            'email_verification_code'            => Hash::make($code),
            'email_verification_code_expires_at' => now()->addMinutes(10),
        ]);

        $user->notify(new EmailVerificationOtpNotification($code));
    }
}
