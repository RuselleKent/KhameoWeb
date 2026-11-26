<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\CompleteOnboardingRequest;
use App\Http\Resources\UserResource;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class CompleteOnboardingController extends Controller
{
    /**
     * PATCH /api/user/onboarding: save every onboarding answer and set onboarded_at.
     * Sent once; a second call changes nothing and returns the user (there's no endpoint to change the path).
     */
    public function __invoke(CompleteOnboardingRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($user->onboarded_at !== null) {
            return response()->json(UserResource::make($user));
        }

        $profile = $request->validated('profile');

        $user->forceFill([
            'onboarding_path' => $request->validated('path'),
            'goals' => $request->validated('goals', []),
            'display_name' => $profile['display_name'],
            'username' => $profile['username'],
            'bio' => ($profile['bio'] ?? '') !== '' ? $profile['bio'] : null,
            'roles' => array_map(fn (array $role) => [
                'name' => $role['name'],
                'audiences' => array_values($role['audiences'] ?? []),
            ], $profile['roles'] ?? []),
            'onboarded_at' => now(),
        ]);

        try {
            $user->save();
        } catch (UniqueConstraintViolationException) {
            // Someone took the username between the check and this save
            throw ValidationException::withMessages(['profile.username' => 'That username is taken.']);
        }

        return response()->json(UserResource::make($user));
    }
}
