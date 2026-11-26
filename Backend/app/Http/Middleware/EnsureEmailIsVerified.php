<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Onboarding endpoints need a verified email. Answers the contract's 403 (docs/api-onboarding.md):
 * { "message": "…", "code": "email_unverified" }, so the app can open /verify-email.
 */
class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Verify your email first.',
                'code' => 'email_unverified',
            ], 403);
        }

        return $next($request);
    }
}
