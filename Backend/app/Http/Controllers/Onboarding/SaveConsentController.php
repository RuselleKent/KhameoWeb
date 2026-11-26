<?php

namespace App\Http\Controllers\Onboarding;

use App\Http\Controllers\Controller;
use App\Http\Requests\Onboarding\SaveConsentRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;

class SaveConsentController extends Controller
{
    /**
     * PATCH /api/user/consent: agree to recording (true) or withdraw (false).
     * Agreeing again to the same version keeps the original time; withdrawing keeps consent_version.
     */
    public function __invoke(SaveConsentRequest $request): JsonResponse
    {
        $user = $request->user();
        $version = config('khameo.consent_version');

        if ($request->boolean('recording_consent')) {
            $alreadyAgreed = $user->recording_consent_at !== null && $user->consent_version === $version;

            $user->forceFill([
                'recording_consent_at' => $alreadyAgreed ? $user->recording_consent_at : now(),
                'consent_version' => $version,
            ]);
        } else {
            $user->forceFill(['recording_consent_at' => null]);
        }

        $user->save();

        return response()->json(UserResource::make($user));
    }
}
