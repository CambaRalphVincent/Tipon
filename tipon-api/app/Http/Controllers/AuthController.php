<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Notifications\EmailVerificationOtpNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    // FR-01 — Participant self-registration (always creates a participant account).
    // Account is created unverified; a code is emailed and must be confirmed via
    // verifyEmail() before a login token is issued.
    public function register(Request $request): JsonResponse
    {
        $request->merge([
            'name'  => trim((string) $request->input('name')),
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::min(8)->mixedCase()->numbers()->symbols()],
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => $data['password'],
            'role'     => 'participant',
        ]);

        $this->issueVerificationCode($user);

        return response()->json([
            'message' => 'Verification code sent to your email.',
            'email'   => $user->email,
        ], 201);
    }

    // FR-02 — Authenticate and issue a Sanctum token. Blocked until email is verified.
    public function login(Request $request): JsonResponse
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json([
                'message' => 'No account found for that email. Please create an account first.',
            ], 404);
        }

        if (!Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        if (!$user->email_verified_at) {
            return response()->json([
                'message'              => 'Please verify your email before logging in.',
                'requires_verification' => true,
                'email'                => $user->email,
            ], 403);
        }

        // Only a browser (stateful) request has a session attached at all —
        // Sanctum's middleware attaches one only when the Origin/Referer
        // matches a configured stateful domain. Establish a real persisted
        // session for that case; a bearer-token client skips this entirely
        // and just gets the token below.
        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    // Confirms a registration/login OTP code and, on success, issues a login token.
    public function verifyEmail(Request $request): JsonResponse
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'email' => ['required', 'email'],
            'code'  => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !$user->email_verification_code || !Hash::check($data['code'], $user->email_verification_code)) {
            return response()->json(['message' => 'Invalid verification code.'], 422);
        }

        if ($user->email_verification_code_expires_at->isPast()) {
            return response()->json(['message' => 'Verification code expired. Please request a new one.'], 422);
        }

        $user->update([
            'email_verified_at'                  => now(),
            'email_verification_code'            => null,
            'email_verification_code_expires_at' => null,
        ]);

        if ($request->hasSession()) {
            Auth::guard('web')->login($user);
            $request->session()->regenerate();
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user'  => $user,
            'token' => $token,
        ]);
    }

    // Resends a fresh OTP code to an unverified account.
    public function resendVerificationCode(Request $request): JsonResponse
    {
        $request->merge([
            'email' => strtolower(trim((string) $request->input('email'))),
        ]);

        $data = $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user) {
            return response()->json(['message' => 'No account found for that email.'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.'], 422);
        }

        $this->issueVerificationCode($user);

        return response()->json(['message' => 'Verification code resent.']);
    }

    // FR-04 — Logout. Revokes the bearer token if one was used, and tears
    // down the session if one was active. A session-authenticated request's
    // "current access token" is a TransientToken (Sanctum's placeholder for
    // that case), which has no delete() method — only a real
    // PersonalAccessToken (bearer-token auth) needs revoking here.
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token instanceof \Laravel\Sanctum\PersonalAccessToken) {
            $token->delete();
        }

        if ($request->hasSession()) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['message' => 'Logged out successfully.']);
    }

    // Returns the authenticated user's profile.
    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
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
