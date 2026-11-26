<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RemoveAvatarController extends Controller
{
    /**
     * DELETE /api/user/avatar: remove the photo. 200 also when there was none.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->avatar_path !== null) {
            Storage::disk('public')->delete($user->avatar_path);
            $user->forceFill(['avatar_path' => null])->save();
        }

        return response()->json(['avatar_url' => null]);
    }
}
