<?php

use App\Mail\PasswordResetLinkMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
});

function resetAccount(): User
{
    return User::factory()->create(['email' => 'jane.cruz@gmail.com', 'password' => 'OldPassw0rd']);
}

/**
 * Ask for a link and return the token from the emailed URL.
 */
function requestResetToken(): string
{
    test()->postJson('/api/forgot-password', ['email' => 'jane.cruz@gmail.com'])->assertOk();

    parse_str(parse_url(Mail::sent(PasswordResetLinkMail::class)->last()->url, PHP_URL_QUERY), $query);

    return $query['token'];
}

it('emails a link to the React reset page', function () {
    resetAccount();

    $this->postJson('/api/forgot-password', ['email' => ' Jane.Cruz@gmail.com '])
        ->assertOk()
        ->assertExactJson(['message' => 'If that email has an account, we sent a reset link.']);

    Mail::assertSent(PasswordResetLinkMail::class, function ($mail) {
        return $mail->hasTo('jane.cruz@gmail.com')
            && str_starts_with($mail->url, config('app.frontend_url').'/reset-password?token=')
            && str_contains($mail->url, 'email=jane.cruz%40gmail.com');
    });
});

it('gives the same answer for an email without an account', function () {
    $this->postJson('/api/forgot-password', ['email' => 'nobody@gmail.com'])
        ->assertOk()
        ->assertExactJson(['message' => 'If that email has an account, we sent a reset link.']);

    Mail::assertNothingSent();
});

it('allows one link per email every 5 minutes', function () {
    resetAccount();
    $this->postJson('/api/forgot-password', ['email' => 'jane.cruz@gmail.com'])->assertOk();

    $response = $this->postJson('/api/forgot-password', ['email' => 'jane.cruz@gmail.com']);

    $response->assertStatus(429)->assertHeader('Retry-After');
    expect($response->json('retry_after'))->toBeGreaterThan(0)->toBeLessThanOrEqual(300);

    $this->travel(301)->seconds();
    $this->postJson('/api/forgot-password', ['email' => 'jane.cruz@gmail.com'])->assertOk();
    Mail::assertSent(PasswordResetLinkMail::class, 2);
});

it('sets the new password without signing in', function () {
    $user = resetAccount();
    $token = requestResetToken();

    $this->postJson('/api/reset-password', [
        'token' => $token,
        'email' => 'jane.cruz@gmail.com',
        'password' => 'NewPassw0rd',
        'password_confirmation' => 'NewPassw0rd',
    ])->assertOk()->assertExactJson(['message' => 'Your password is updated.']);

    expect(Hash::check('NewPassw0rd', $user->fresh()->password))->toBeTrue();
    $this->assertGuest();
});

it('lets the link work only once', function () {
    resetAccount();
    $token = requestResetToken();
    $payload = [
        'token' => $token,
        'email' => 'jane.cruz@gmail.com',
        'password' => 'NewPassw0rd',
        'password_confirmation' => 'NewPassw0rd',
    ];

    $this->postJson('/api/reset-password', $payload)->assertOk();
    $this->postJson('/api/reset-password', [...$payload, 'password' => 'Another1pass', 'password_confirmation' => 'Another1pass'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.token.0', 'This reset link has expired. Ask for a new one.');
});

it('rejects a wrong or expired token', function () {
    resetAccount();
    requestResetToken();

    $this->postJson('/api/reset-password', [
        'token' => 'not-the-token',
        'email' => 'jane.cruz@gmail.com',
        'password' => 'NewPassw0rd',
        'password_confirmation' => 'NewPassw0rd',
    ])->assertUnprocessable()->assertJsonPath('errors.token.0', 'This reset link has expired. Ask for a new one.');
});

it('refuses the current password and keeps the link usable', function () {
    resetAccount();
    $token = requestResetToken();

    $this->postJson('/api/reset-password', [
        'token' => $token,
        'email' => 'jane.cruz@gmail.com',
        'password' => 'OldPassw0rd',
        'password_confirmation' => 'OldPassw0rd',
    ])->assertUnprocessable()->assertJsonPath('errors.password.0', 'Choose a password you haven’t used on Khameo before.');

    $this->postJson('/api/reset-password', [
        'token' => $token,
        'email' => 'jane.cruz@gmail.com',
        'password' => 'NewPassw0rd',
        'password_confirmation' => 'NewPassw0rd',
    ])->assertOk();
});

it('returns the contract messages for a weak password', function (array $fields, string $field, string $message) {
    resetAccount();
    $token = requestResetToken();

    $this->postJson('/api/reset-password', [
        'token' => $token,
        'email' => 'jane.cruz@gmail.com',
        ...$fields,
    ])->assertUnprocessable()->assertJsonPath("errors.{$field}.0", $message);
})->with([
    'too short' => [['password' => 'Ab1', 'password_confirmation' => 'Ab1'], 'password', 'Use at least 8 characters.'],
    'no number' => [['password' => 'OnlyLetters', 'password_confirmation' => 'OnlyLetters'], 'password', 'Use a mix of letters and numbers.'],
    'mismatch' => [['password' => 'NewPassw0rd', 'password_confirmation' => 'Other1234'], 'password_confirmation', 'Passwords don’t match.'],
]);
