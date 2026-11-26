<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\CheckUsernameRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class CheckUsernameController extends Controller
{
    /**
     * GET /api/usernames/check?username=: is it free? Ignores case; the user's own username counts as free.
     * A hint only: PATCH /api/user/onboarding checks again.
     */
    public function __invoke(CheckUsernameRequest $request): JsonResponse
    {
        $taken = User::query()
            ->whereRaw('lower(username) = ?', [strtolower($request->validated('username'))])
            ->whereKeyNot($request->user()->id)
            ->exists();

        return response()->json(['available' => ! $taken]);
    }
}
