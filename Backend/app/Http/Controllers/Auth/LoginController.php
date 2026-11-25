<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    private const MAX_FAILED_ATTEMPTS = 5;

    private const LOCKOUT_SECONDS = 900;

    /**
     * POST /api/login: check the credentials and start the session.
     *
     * Unverified users can log in too; the frontend sends them to the verify-email page.
     */
    public function __invoke(LoginRequest $request): JsonResponse
    {
        $throttleKey = $this->throttleKey($request);

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_FAILED_ATTEMPTS)) {
            return $this->lockedOutResponse($throttleKey);
        }

        $user = User::where('email', $request->validated('email'))->first();

        if ($user === null) {
            $this->failAttempt($throttleKey, 'email', 'We couldn’t find an account with this email.');
        }

        if (! Hash::check($request->validated('password'), $user->password)) {
            $this->failAttempt($throttleKey, 'password', 'That password isn’t right. Try again, or reset it.');
        }

        if (! $user->canLogIn()) {
            return response()->json(['message' => 'This account can’t log in.'], 403);
        }

        RateLimiter::clear($throttleKey);
        Auth::login($user, $request->boolean('remember'));

        return response()->json(UserResource::make($user));
    }

    /**
     * Failures are counted per email and IP address, so one person's typos
     * don't lock out everyone else.
     */
    private function throttleKey(LoginRequest $request): string
    {
        return 'login:'.Str::transliterate($request->validated('email').'|'.$request->ip());
    }

    /**
     * Count the failed try and answer with a 422 on the given field.
     */
    private function failAttempt(string $throttleKey, string $field, string $message): never
    {
        RateLimiter::hit($throttleKey, self::LOCKOUT_SECONDS);

        throw ValidationException::withMessages([$field => $message]);
    }

    private function lockedOutResponse(string $throttleKey): JsonResponse
    {
        $retryAfter = RateLimiter::availableIn($throttleKey);

        return response()->json([
            'message' => 'Too many requests.',
            'retry_after' => $retryAfter,
        ], 429)->header('Retry-After', (string) $retryAfter);
    }
}