<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CurrentUserController extends Controller
{
    /**
     * GET /api/user: who is signed in. Guests get a 401 from the auth middleware.
     */
    public function __invoke(Request $request): JsonResponse
    {
        return response()->json(UserResource::make($request->user()));
    }
}