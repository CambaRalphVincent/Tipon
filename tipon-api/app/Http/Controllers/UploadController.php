<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UploadController extends Controller
{
    // Event thumbnails: JPG/PNG/WEBP only, max 2 MB. `image` verifies the file is
    // actually a decodable image (not just a renamed extension); `mimes` narrows
    // the whitelist to exclude SVG (can carry embedded scripts/XXE) and GIF.
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $path = $request->file('file')->store('covers', 'public');

        return response()->json(['url' => Storage::disk('public')->url($path)]);
    }
}
