<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Livewire experiment: participant-facing event browsing/detail pages,
// server-rendered alongside the main React SPA. Session-authenticated only
// (see AuthController — login establishes a session for browser clients).
Route::middleware(['auth', 'role:participant'])->group(function () {
    Route::livewire('/events', 'events-browse')->name('livewire.events.browse');
    Route::livewire('/events/{event}', 'event-detail')->name('livewire.events.detail');

    // A plain form POST (not a Livewire action) so the layout's "Sign out"
    // button works identically to AuthController::logout() — tears down the
    // session, then sends the browser back to the React app's login screen.
    Route::post('/logout-livewire', function (Request $request) {
        Auth::guard('web')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect(config('app.frontend_url').'/');
    })->name('livewire.logout');
});
