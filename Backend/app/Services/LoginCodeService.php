<?php

namespace App\Services;

use App\Mail\LoginCodeMail;
use App\Models\User;
use App\Services\Concerns\IssuesEmailCodes;
use Illuminate\Support\Facades\Mail;

/**
 * The emailed 6-digit code that finishes every email log in of a verified account (docs/api-auth.md 2–2b).
 * Same rules as the verify-email code, stored apart in login_codes.
 */
class LoginCodeService
{
    use IssuesEmailCodes;

    /**
     * Replace any earlier code with a new one and email it.
     */
    public function send(User $user): void
    {
        [$code, $attributes] = $this->newCode();

        $user->loginCode()->updateOrCreate([], $attributes);

        Mail::to($user)->send(new LoginCodeMail($user, $code, intdiv(self::CODE_LIFETIME_SECONDS, 60)));
    }

    /**
     * Seconds the user still has to wait before asking for another code (0 = allowed now).
     */
    public function secondsUntilResend(User $user): int
    {
        return $this->secondsUntilResendFor($user->loginCode()->first());
    }

    /**
     * The timers of the code the user has now, for a log in that didn't send a new one.
     *
     * @return array{expires_in: int, resend_in: int}
     */
    public function currentTimers(User $user): array
    {
        $record = $user->loginCode()->first();

        return [
            'expires_in' => $record ? max(0, (int) ceil(now()->diffInSeconds($record->expires_at, false))) : 0,
            'resend_in' => $this->secondsUntilResendFor($record),
        ];
    }

    /**
     * Whether the user has a code that can still be used (not expired, tries left).
     */
    public function hasUsableCode(User $user): bool
    {
        $record = $user->loginCode()->first();

        return $record !== null && $record->expires_at->isFuture() && $record->attempts_left > 0;
    }

    /**
     * Use up the code, or throw a VerificationCodeException.
     */
    public function verify(User $user, string $code): void
    {
        $record = $user->loginCode()->first();

        $this->checkCode($record, $code);

        $record->delete();
    }
}
