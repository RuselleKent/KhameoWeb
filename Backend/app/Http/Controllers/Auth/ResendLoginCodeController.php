<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\LoginCodeService;
use Illuminate\Http\JsonResponse;

class ResendLoginCodeController extends Controller
{
    use PendingLogin;

    /**
     * POST /api/login/two-factor/resend: email a new log in code, unless one was sent less than a minute ago.
     */
    public function __invoke(LoginCodeService $codes): JsonResponse
    {
        $pending = $this->pendingLogin();

        if ($pending === null) {
            return $this->loginExpiredResponse();
        }

        $retryAfter = $codes->secondsUntilResend($pending['user']);

        if ($retryAfter > 0) {
            return response()->json([
                'message' => 'Please wait before asking for another code.',
                'retry_after' => $retryAfter,
            ], 429)->header('Retry-After', (string) $retryAfter);
        }

        $codes->send($pending['user']);

        return response()->json([
            'message' => 'We sent a new code.',
            ...$codes->timers(),
        ]);
    }
}
