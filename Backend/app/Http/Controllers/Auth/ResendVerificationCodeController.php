<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResendVerificationCodeController extends Controller
{
    /**
     * POST /api/email/resend: email a new code, unless one was sent less than a minute ago.
     */
    public function __invoke(Request $request, EmailVerificationCodeService $codes): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Your email is already verified.']);
        }

        $retryAfter = $codes->secondsUntilResend($user);

        if ($retryAfter > 0) {
            return response()->json([
                'message' => 'Please wait before asking for another code.',
                'retry_after' => $retryAfter,
            ], 429)->header('Retry-After', (string) $retryAfter);
        }

        $codes->send($user);

        return response()->json([
            'message' => 'We sent a new code.',
            ...$codes->timers(),
        ]);
    }
}