<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\EmailVerificationCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Throwable;

class RegisterController extends Controller
{
    /**
     * POST /api/register: create the account, sign the user in (unverified) and email a code.
     *
     * If the email cannot be sent the account still exists, and the user can ask for a new
     * code from the verify-email page.
     */
    public function __invoke(RegisterRequest $request, EmailVerificationCodeService $codes): JsonResponse
    {
        $user = User::create([
            ...$request->safe()->only(['name', 'email', 'password']),
            'terms_accepted_at' => now(),
        ]);

        Auth::login($user);

        try {
            $codes->send($user);
        } catch (Throwable $exception) {
            report($exception);
        }

        return response()->json([
            'user' => UserResource::make($user),
            'verification' => $codes->timers(),
        ], 201);
    }
}