<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Models\User;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ResetPasswordController extends Controller
{
    /**
     * POST /api/reset-password: set a new password with the emailed token.
     * Never signs in: the user logs in next, with the emailed log in code.
     */
    public function __invoke(ResetPasswordRequest $request): JsonResponse
    {
        $status = Password::reset(
            $request->safe()->only(['email', 'password', 'password_confirmation', 'token']),
            function (User $user, string $password) {
                if (Hash::check($password, $user->password)) {
                    throw ValidationException::withMessages([
                        'password' => 'Choose a password you haven’t used on Khameo before.',
                    ]);
                }

                $user->forceFill(['password' => $password])->setRememberToken(Str::random(60));
                $user->save();

                event(new PasswordReset($user));
            },
        );

        if ($status !== Password::PASSWORD_RESET) {
            // Wrong, used or expired token, or no account with this email
            throw ValidationException::withMessages([
                'token' => 'This reset link has expired. Ask for a new one.',
            ]);
        }

        return response()->json(['message' => 'Your password is updated.']);
    }
}
