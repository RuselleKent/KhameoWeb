<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;

class LogoutController extends Controller
{
    /**
     * POST /api/logout: end the session.
     */
    public function __invoke(Request $request): Response
    {
        Auth::guard('web')->logout();

        // Requests without a cookie session (API tokens) have no session to end
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->noContent();
    }
}