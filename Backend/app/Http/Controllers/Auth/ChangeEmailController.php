<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ChangeEmailRequest;
use App\Http\Resources\UserResource;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\JsonResponse;
use Throwable;

class ChangeEmailController extends Controller
{
    /**
     * POST /api/email/change: "Wrong email? Change it" on the verify-email page.
     * Only before the email is verified. Swaps the address and emails a new code to it (the old one stops working).
     */
    public function __invoke(ChangeEmailRequest $request, EmailVerificationCodeService $codes): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Your email is already verified.',
                'code' => 'already_verified',
            ], 403);
        }

        $user->forceFill(['email' => $request->validated('email')])->save();

        try {
            $codes->send($user);
        } catch (Throwable $exception) {
            // Same as at sign-up: the user can ask for a new code from the page
            report($exception);
        }

        return response()->json([
            'user' => UserResource::make($user),
            'verification' => $codes->timers(),
        ]);
    }
}
