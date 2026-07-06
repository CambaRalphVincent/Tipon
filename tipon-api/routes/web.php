<?php

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\EventController;
use App\Http\Controllers\RegistrationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Livewire experiment: participant-facing event browsing/detail pages,
// server-rendered alongside the main React SPA. Session-authenticated only
// (see AuthController — login establishes a session for browser clients).
Route::middleware(['auth', 'role:participant'])->group(function () {
    Route::get('/events', [EventController::class, 'browsePage'])->name('livewire.events.browse');
    Route::get('/events/{event}', [EventController::class, 'detailPage'])->name('livewire.events.detail');
    Route::post('/events/{event}/register', [RegistrationController::class, 'storePage'])->name('livewire.events.register');
    Route::post('/events/{event}/cancel-registration', [RegistrationController::class, 'cancelForEventPage'])->name('livewire.events.cancel');
    Route::post('/notifications/read-all', function (Request $request) {
        $request->user()->unreadNotifications->markAsRead();

        return back();
    })->name('livewire.notifications.readAll');
    Route::post('/notifications/{notification}/read', function (Request $request, string $notification) {
        $request->user()->notifications()->findOrFail($notification)->markAsRead();

        return back();
    })->name('livewire.notifications.read');

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
