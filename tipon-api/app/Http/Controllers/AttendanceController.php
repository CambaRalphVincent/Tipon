<?php

namespace App\Http\Controllers;

use App\Models\Registration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    // FR-10 — Organizer marks a registrant's attendance.
    public function update(Request $request, Registration $registration): JsonResponse
    {
        if ($registration->event->organizer_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $data = $request->validate([
            'attendance' => ['required', 'in:pending,present,absent'],
        ]);

        $registration->update($data);

        return response()->json($registration);
    }
}
