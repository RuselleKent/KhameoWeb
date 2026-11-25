<?php

namespace App\Services;

use App\Exceptions\VerificationCodeException;
use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

class EmailVerificationCodeService
{
    private const CODE_LIFETIME_SECONDS = 600;

    private const RESEND_COOLDOWN_SECONDS = 60;

    private const MAX_ATTEMPTS = 3;

    /**
     * The timers the verify-email page starts counting from.
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
     * Replace any earlier code with a new one and email it.
     */
    public function send(User $user): void
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        $user->emailVerificationCode()->updateOrCreate([], [
            'code_hash' => Hash::make($code),
            'attempts_left' => self::MAX_ATTEMPTS,
            'expires_at' => now()->addSeconds(self::CODE_LIFETIME_SECONDS),
            'resend_available_at' => now()->addSeconds(self::RESEND_COOLDOWN_SECONDS),
        ]);

        Mail::to($user)->send(
            new VerificationCodeMail($user, $code, intdiv(self::CODE_LIFETIME_SECONDS, 60)),
        );
    }

    /**
     * Seconds the user still has to wait before asking for another code (0 = allowed now).
     */
    public function secondsUntilResend(User $user): int
    {
        $record = $user->emailVerificationCode()->first();

        if ($record === null) {
            return 0;
        }

        return max(0, (int) ceil(now()->diffInSeconds($record->resend_available_at, false)));
    }

    /**
     * Mark the user's email as verified, or throw a VerificationCodeException.
     */
    public function verify(User $user, string $code): void
    {
        if ($user->hasVerifiedEmail()) {
            return;
        }

        $record = $user->emailVerificationCode()->first();

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

        DB::transaction(function () use ($user, $record) {
            $user->markEmailAsVerified();
            $record->delete();
        });
    }
}