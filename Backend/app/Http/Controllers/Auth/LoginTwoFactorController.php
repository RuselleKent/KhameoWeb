<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginCodeRequest;
use App\Http\Resources\UserResource;
use App\Services\LoginCodeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class LoginTwoFactorController extends Controller
{
    use PendingLogin;

    /**
     * POST /api/login/two-factor: check the emailed code and start the session (keeps "remember").
     * 422 code_invalid / code_expired / too_many_attempts; 401 login_expired.
     */
    public function __invoke(LoginCodeRequest $request, LoginCodeService $codes): JsonResponse
    {
        $pending = $this->pendingLogin();

        if ($pending === null) {
            return $this->loginExpiredResponse();
        }

        $codes->verify($pending['user'], $request->validated('code'));

        session()->forget(LoginController::PENDING_SESSION_KEY);
        Auth::login($pending['user'], $pending['remember']);

        return response()->json(UserResource::make($pending['user']));
    }
}
