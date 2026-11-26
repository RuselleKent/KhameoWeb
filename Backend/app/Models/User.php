<?php

namespace App\Models;

use App\Mail\PasswordResetLinkMail;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
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
            'onboarded_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'recording_consent_at' => 'datetime',
            'two_factor_confirmed_at' => 'datetime',
            'goals' => 'array',
            'roles' => 'array',
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

    // The 6-digit code that confirms this user's email address
    public function emailVerificationCode(): HasOne
    {
        return $this->hasOne(EmailVerificationCode::class);
    }

    // The 6-digit code that finishes an email log in
    public function loginCode(): HasOne
    {
        return $this->hasOne(LoginCode::class);
    }

    // Public URL of the profile photo, or null
    public function avatarUrl(): ?string
    {
        return $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null;
    }

    // Laravel's password broker calls this. The link opens the React reset page.
    public function sendPasswordResetNotification($token): void
    {
        $url = rtrim(config('app.frontend_url'), '/').'/reset-password?'.http_build_query([
            'token' => $token,
            'email' => $this->email,
        ]);

        Mail::to($this)->send(new PasswordResetLinkMail($this, $url, (int) config('auth.passwords.users.expire')));
    }
}
