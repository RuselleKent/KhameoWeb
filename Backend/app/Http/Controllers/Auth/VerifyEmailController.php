<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerifyEmailController extends Controller
{
    /**
     * POST /api/email/verify: check the code for the signed-in user.
     */
    public function __invoke(Request $request, EmailVerificationCodeService $codes): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();

        $codes->verify($user, $validated['code']);

        return response()->json([
            'user' => UserResource::make($user),
        ]);
    }
}