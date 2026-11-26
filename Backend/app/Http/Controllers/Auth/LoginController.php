<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\LoginCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;

class LoginController extends Controller
{
    private const MAX_FAILED_ATTEMPTS = 5;

    private const LOCKOUT_SECONDS = 900;

    /**
     * Session key of a log in waiting for its emailed code: [user_id, remember, started_at].
     */
    public const PENDING_SESSION_KEY = 'login_code';

    /**
     * POST /api/login: check the credentials.
     *
     * A verified account gets a 6-digit code by email and is NOT signed in yet: POST /api/login/two-factor
     * finishes the log in (docs/api-auth.md section 2). Unverified accounts are signed in right away and
     * the frontend sends them to the verify-email page, which emails its own code.
     */
    public function __invoke(LoginRequest $request, LoginCodeService $codes): JsonResponse
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

        if (! $user->hasVerifiedEmail()) {
            Auth::login($user, $request->boolean('remember'));

            return response()->json(UserResource::make($user));
        }

        return $this->startCodeStep($user, $request->boolean('remember'), $codes);
    }

    /**
     * Email a code (unless the last one is still usable and under a minute old) and remember who is logging in.
     */
    private function startCodeStep(User $user, bool $remember, LoginCodeService $codes): JsonResponse
    {
        $timers = $codes->timers();

        if ($codes->secondsUntilResend($user) > 0 && $codes->hasUsableCode($user)) {
            // Logging in twice within a minute: the code already sent still works
            $timers = $codes->currentTimers($user);
        } else {
            try {
                $codes->send($user);
            } catch (Throwable $exception) {
                // The user can ask for a new code from the code page
                report($exception);
            }
        }

        session()->put(self::PENDING_SESSION_KEY, [
            'user_id' => $user->id,
            'remember' => $remember,
            'started_at' => now()->getTimestamp(),
        ]);

        return response()->json([
            'two_factor_required' => true,
            'email' => $user->email,
            ...$timers,
        ]);
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
