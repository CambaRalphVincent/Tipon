<?php

namespace App\Http\Controllers;

use App\Services\OrganizerNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    // FR-12 — User views their notifications.
    public function index(Request $request): JsonResponse
    {
        if ($request->user()->role === 'organizer') {
            app(OrganizerNotificationService::class)->syncDueReminders($request->user());
        }

        $notifications = $request->user()->notifications()->latest()->get();

        return response()->json($notifications);
    }

    // Mark a single notification as read.
    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }
}
