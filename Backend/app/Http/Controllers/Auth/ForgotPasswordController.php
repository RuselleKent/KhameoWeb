<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Throwable;

class ForgotPasswordController extends Controller
{
    private const COOLDOWN_SECONDS = 300;

    /**
     * POST /api/forgot-password: email a reset link (Laravel's password broker).
     * Same answer whether or not the account exists, so the form can't be used to find accounts.
     * One request per email every 5 minutes.
     */
    public function __invoke(ForgotPasswordRequest $request): JsonResponse
    {
        $email = $request->validated('email');
        $throttleKey = 'forgot-password:'.sha1($email);

        if (RateLimiter::tooManyAttempts($throttleKey, 1)) {
            $retryAfter = RateLimiter::availableIn($throttleKey);

            return response()->json([
                'message' => 'Too many requests.',
                'retry_after' => $retryAfter,
            ], 429)->header('Retry-After', (string) $retryAfter);
        }

        RateLimiter::hit($throttleKey, self::COOLDOWN_SECONDS);

        try {
            // Sends PasswordResetLinkMail through User::sendPasswordResetNotification
            Password::sendResetLink(['email' => $email]);
        } catch (Throwable $exception) {
            report($exception);
        }

        return response()->json(['message' => 'If that email has an account, we sent a reset link.']);
    }
}
