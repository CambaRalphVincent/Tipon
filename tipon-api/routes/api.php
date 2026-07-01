<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\RegistrationController;
use App\Http\Controllers\UploadController;
use Illuminate\Support\Facades\Route;

// Public
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // File upload — organizers only
    Route::middleware('role:organizer')->post('/upload', [UploadController::class, 'store']);

    // Events — readable by all authenticated users
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{event}', [EventController::class, 'show']);

    // Notifications — all authenticated users
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    // Participant only
    Route::middleware('role:participant')->group(function () {
        Route::get('/my-registrations', [RegistrationController::class, 'myRegistrations']);
        Route::post('/events/{event}/registrations', [RegistrationController::class, 'store']);
        Route::delete('/registrations/{registration}', [RegistrationController::class, 'cancel']);
    });

    // Organizer only
    Route::middleware('role:organizer')->group(function () {
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{event}', [EventController::class, 'update']);
        Route::delete('/events/{event}', [EventController::class, 'destroy']);
        Route::get('/organizer/registrations', [RegistrationController::class, 'organizerRegistrations']);
        Route::get('/events/{event}/registrations', [RegistrationController::class, 'index']);
        Route::put('/registrations/{registration}/attendance', [AttendanceController::class, 'update']);
    });

    // Admin only
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/users', [AdminController::class, 'index']);
        Route::post('/admin/organizers', [AdminController::class, 'createOrganizer']);
        Route::put('/admin/users/{user}/promote', [AdminController::class, 'promote']);
    });
});
