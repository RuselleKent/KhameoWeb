<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The user object from docs/api-auth.md.
 *
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'recording_consent_at' => $this->recording_consent_at,
            'consent_version' => $this->consent_version,
            'onboarded_at' => $this->onboarded_at,
            'onboarding_path' => $this->onboarding_path,
            'display_name' => $this->display_name,
            'username' => $this->username,
            'bio' => $this->bio,
            // Speaking roles: [{ name, audiences: [...] }], not group roles
            'roles' => $this->roles ?? [],
            'avatar_url' => $this->avatarUrl(),
            'two_factor_confirmed_at' => $this->two_factor_confirmed_at,
            'host_status' => $this->host_status ?? 'none',
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
