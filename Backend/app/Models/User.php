<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable;

    // Host verification statuses
    public const HOST_NONE = 'none';
    public const HOST_PENDING = 'pending';
    public const HOST_VERIFIED = 'verified';
    public const HOST_REJECTED = 'rejected';

    // Account statuses
    public const STATUS_ACTIVE = 'active';
    public const STATUS_SUSPENDED = 'suspended';
    public const STATUS_DEACTIVATED = 'deactivated';

    // Fields the Create account form is allowed to fill
    protected $fillable = [
        'name',
        'email',
        'password',
        'google_id',
        'terms_accepted_at',
    ];

    // Never sent to React in JSON
    protected $hidden = [
        'password',
        'remember_token',
        'google_id',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'password' => 'hashed',      // automatically hashes passwords
            'is_admin' => 'boolean',
        ];
    }

    // Only verified Hosts can create groups
    public function isVerifiedHost(): bool
    {
        return $this->host_status === self::HOST_VERIFIED;
    }

    // Suspended or deactivated accounts can't log in
    public function canLogIn(): bool
    {
        return $this->account_status === self::STATUS_ACTIVE;
    }
}