<?php

use App\Mail\VerificationCodeMail;
use App\Models\User;
use App\Services\EmailVerificationCodeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
});

/**
 * Send a code the way the app does and return the plain code from the email.
 */
function sendCodeTo(User $user): string
{
    app(EmailVerificationCodeService::class)->send($user);

    return Mail::sent(VerificationCodeMail::class)->last()->code;
}

function unverifiedUser(): User
{
    return User::factory()->create(['email_verified_at' => null]);
}

function wrongCodeFor(string $code): string
{
    return $code === '000000' ? '000001' : '000000';
}

it('emails a 6-digit code when an account is created', function () {
    $this->postJson('/api/register', [
        'name' => 'Jane Cruz',
        'email' => 'jane.cruz@gmail.com',
        'password' => 'Kh4meo!2026',
        'password_confirmation' => 'Kh4meo!2026',
        'confirmed_age' => true,
        'accepted_terms' => true,
    ])->assertCreated();

    Mail::assertSent(VerificationCodeMail::class, fn ($mail) => $mail->hasTo('jane.cruz@gmail.com')
        && preg_match('/^\d{6}$/', $mail->code) === 1);
});

it('still creates the account when the email cannot be sent', function () {
    Mail::shouldReceive('to')->andThrow(new RuntimeException('SMTP is down'));

    $this->postJson('/api/register', [
        'name' => 'Jane Cruz',
        'email' => 'jane.cruz@gmail.com',
        'password' => 'Kh4meo!2026',
        'password_confirmation' => 'Kh4meo!2026',
        'confirmed_age' => true,
        'accepted_terms' => true,
    ])->assertCreated();

    $this->assertDatabaseHas('users', ['email' => 'jane.cruz@gmail.com']);
});

it('verifies the email with the right code', function () {
    $user = unverifiedUser();
    $code = sendCodeTo($user);

    $this->actingAs($user)
        ->postJson('/api/email/verify', ['code' => $code])
        ->assertOk()
        ->assertJsonPath('user.email', $user->email);

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
    $this->assertDatabaseCount('email_verification_codes', 0);
});

it('counts down wrong attempts and then locks the code', function () {
    $user = unverifiedUser();
    $code = sendCodeTo($user);
    $wrongCode = wrongCodeFor($code);

    $this->actingAs($user);

    $this->postJson('/api/email/verify', ['code' => $wrongCode])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'code_invalid')
        ->assertJsonPath('attempts_left', 2)
        ->assertJsonPath('errors.code.0', 'That code isn’t right.');

    $this->postJson('/api/email/verify', ['code' => $wrongCode])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'code_invalid')
        ->assertJsonPath('attempts_left', 1);

    $this->postJson('/api/email/verify', ['code' => $wrongCode])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'too_many_attempts')
        ->assertJsonPath('attempts_left', 0);

    $this->postJson('/api/email/verify', ['code' => $code])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'too_many_attempts');

    expect($user->fresh()->hasVerifiedEmail())->toBeFalse();
});

it('rejects a code older than 10 minutes', function () {
    $user = unverifiedUser();
    $code = sendCodeTo($user);

    $this->travel(11)->minutes();

    $this->actingAs($user)
        ->postJson('/api/email/verify', ['code' => $code])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'code_expired');
});

it('asks for a new code when none was ever sent', function () {
    $this->actingAs(unverifiedUser())
        ->postJson('/api/email/verify', ['code' => '123456'])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'code_expired');
});

it('treats an already verified user as done', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->postJson('/api/email/verify', ['code' => '123456'])
        ->assertOk()
        ->assertJsonPath('user.email', $user->email);
});

it('refuses to resend during the cooldown', function () {
    $user = unverifiedUser();
    sendCodeTo($user);

    $response = $this->actingAs($user)->postJson('/api/email/resend');

    $response->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJsonPath('message', 'Please wait before asking for another code.');

    expect($response->json('retry_after'))->toBeGreaterThan(0)->toBeLessThanOrEqual(60);
    Mail::assertSent(VerificationCodeMail::class, 1);
});

it('sends a new code after the cooldown', function () {
    $user = unverifiedUser();
    sendCodeTo($user);

    $this->travel(61)->seconds();

    $this->actingAs($user)
        ->postJson('/api/email/resend')
        ->assertOk()
        ->assertJsonPath('message', 'We sent a new code.')
        ->assertJsonPath('expires_in', 600)
        ->assertJsonPath('resend_in', 60);

    Mail::assertSent(VerificationCodeMail::class, 2);

    $newCode = Mail::sent(VerificationCodeMail::class)->last()->code;

    $this->postJson('/api/email/verify', ['code' => $newCode])->assertOk();
    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('does not resend to an already verified user', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->postJson('/api/email/resend')
        ->assertOk()
        ->assertJsonPath('message', 'Your email is already verified.');

    Mail::assertNothingSent();
});

it('requires a signed-in user', function () {
    $this->postJson('/api/email/verify', ['code' => '123456'])->assertUnauthorized();
    $this->postJson('/api/email/resend')->assertUnauthorized();
});
