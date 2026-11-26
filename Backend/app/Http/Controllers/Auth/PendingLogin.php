<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use Illuminate\Http\JsonResponse;

/**
 * The log in waiting for its emailed code, kept in the session by LoginController.
 */
trait PendingLogin
{
    /**
     * The user logging in, or null when no log in is waiting (or it is older than the allowed window).
     *
     * @return array{user: User, remember: bool}|null
     */
    private function pendingLogin(): ?array
    {
        $pending = session(LoginController::PENDING_SESSION_KEY);
        $window = (int) config('khameo.login_code_window_minutes') * 60;

        if (! is_array($pending) || now()->getTimestamp() - ($pending['started_at'] ?? 0) > $window) {
            session()->forget(LoginController::PENDING_SESSION_KEY);

            return null;
        }

        $user = User::find($pending['user_id'] ?? null);

        if ($user === null || ! $user->canLogIn()) {
            session()->forget(LoginController::PENDING_SESSION_KEY);

            return null;
        }

        return ['user' => $user, 'remember' => (bool) ($pending['remember'] ?? false)];
    }

    private function loginExpiredResponse(): JsonResponse
    {
        return response()->json(['message' => 'Log in again.', 'code' => 'login_expired'], 401);
    }
}
