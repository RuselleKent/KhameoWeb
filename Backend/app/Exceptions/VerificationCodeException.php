<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

/**
 * A verification code was rejected. Renders the 422 body from docs/api-auth.md (section 3).
 */
class VerificationCodeException extends Exception
{
    private function __construct(
        private readonly string $errorCode,
        string $message,
        private readonly ?int $attemptsLeft = null,
    ) {
        parent::__construct($message);
    }

    public static function invalid(int $attemptsLeft): self
    {
        return new self('code_invalid', 'That code isn’t right.', $attemptsLeft);
    }

    public static function expired(): self
    {
        return new self('code_expired', 'This code has expired.');
    }

    public static function tooManyAttempts(): self
    {
        return new self('too_many_attempts', 'Too many tries.', 0);
    }

    public function render(): JsonResponse
    {
        $body = [
            'message' => $this->getMessage(),
            'errors' => ['code' => [$this->getMessage()]],
            'error' => $this->errorCode,
        ];

        if ($this->attemptsLeft !== null) {
            $body['attempts_left'] = $this->attemptsLeft;
        }

        return response()->json($body, 422);
    }
}