<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * The user object from docs/api-auth.md.
 *
 * @mixin \App\Models\User
 */
class UserResource extends JsonResource
{
    /**
     * @return array{id: int, name: string, email: string, email_verified_at: ?\Illuminate\Support\Carbon, onboarded_at: ?\Illuminate\Support\Carbon, created_at: ?\Illuminate\Support\Carbon, updated_at: ?\Illuminate\Support\Carbon}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'email_verified_at' => $this->email_verified_at,
            'onboarded_at' => $this->onboarded_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}