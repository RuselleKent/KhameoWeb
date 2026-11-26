<?php

namespace App\Services\Concerns;

use App\Exceptions\VerificationCodeException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

/**
 * Shared rules for emailed 6-digit codes (verify email, log in): 10 minutes, 3 tries, 60 s before a resend.
 * The code row needs code_hash, attempts_left, expires_at and resend_available_at.
 */
trait IssuesEmailCodes
{
    private const CODE_LIFETIME_SECONDS = 600;

    private const RESEND_COOLDOWN_SECONDS = 60;

    private const MAX_ATTEMPTS = 3;

    /**
     * The timers the code pages start counting from.
     *
     * @return array{expires_in: int, resend_in: int}
     */
    public function timers(): array
    {
        return [
            'expires_in' => self::CODE_LIFETIME_SECONDS,
            'resend_in' => self::RESEND_COOLDOWN_SECONDS,
        ];
    }

    /**
     * A new random code and the columns to store for it (only its hash).
     *
     * @return array{0: string, 1: array<string, mixed>}
     */
    private function newCode(): array
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        return [$code, [
            'code_hash' => Hash::make($code),
            'attempts_left' => self::MAX_ATTEMPTS,
            'expires_at' => now()->addSeconds(self::CODE_LIFETIME_SECONDS),
            'resend_available_at' => now()->addSeconds(self::RESEND_COOLDOWN_SECONDS),
        ]];
    }

    /**
     * Seconds until a resend is allowed for this code row (0 = allowed now, or no row).
     */
    private function secondsUntilResendFor(?Model $record): int
    {
        if ($record === null) {
            return 0;
        }

        return max(0, (int) ceil(now()->diffInSeconds($record->resend_available_at, false)));
    }

    /**
     * Throw a VerificationCodeException unless `$code` matches the row. A wrong code uses up a try.
     */
    private function checkCode(?Model $record, string $code): void
    {
        if ($record === null || $record->expires_at->isPast()) {
            throw VerificationCodeException::expired();
        }

        if ($record->attempts_left <= 0) {
            throw VerificationCodeException::tooManyAttempts();
        }

        if (! Hash::check($code, $record->code_hash)) {
            $record->decrement('attempts_left');

            throw $record->attempts_left > 0
                ? VerificationCodeException::invalid($record->attempts_left)
                : VerificationCodeException::tooManyAttempts();
        }
    }
}
