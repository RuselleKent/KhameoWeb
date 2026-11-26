<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\UploadAvatarRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;

class UploadAvatarController extends Controller
{
    /**
     * POST /api/user/avatar: store the photo on the public disk (for now) and replace the old one.
     */
    public function __invoke(UploadAvatarRequest $request): JsonResponse
    {
        $user = $request->user();
        $oldPath = $user->avatar_path;

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->forceFill(['avatar_path' => $path])->save();

        if ($oldPath !== null && $oldPath !== $path) {
            Storage::disk('public')->delete($oldPath);
        }

        return response()->json(['avatar_url' => $user->avatarUrl()]);
    }
}
