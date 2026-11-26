<?php

namespace App\Services;

use App\Mail\VerificationCodeMail;
use App\Models\User;
use App\Services\Concerns\IssuesEmailCodes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class EmailVerificationCodeService
{
    use IssuesEmailCodes;

    /**
     * Replace any earlier code with a new one and email it.
     */
    public function send(User $user): void
    {
        [$code, $attributes] = $this->newCode();

        $user->emailVerificationCode()->updateOrCreate([], $attributes);

        Mail::to($user)->send(
            new VerificationCodeMail($user, $code, intdiv(self::CODE_LIFETIME_SECONDS, 60)),
        );
    }

    /**
     * Seconds the user still has to wait before asking for another code (0 = allowed now).
     */
    public function secondsUntilResend(User $user): int
    {
        return $this->secondsUntilResendFor($user->emailVerificationCode()->first());
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

        $this->checkCode($record, $code);

        DB::transaction(function () use ($user, $record) {
            $user->markEmailAsVerified();
            $record->delete();
        });
    }
}
