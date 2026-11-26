<?php

use App\Mail\LoginCodeMail;
use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
});

function verifiedAccount(array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'email' => 'jane.cruz@gmail.com',
        'password' => 'Kh4meo!2026',
    ], $attributes));
}

/**
 * Start a log in and return the code from the email.
 */
function startLogIn(bool $remember = false): string
{
    test()->postJson('/api/login', [
        'email' => 'jane.cruz@gmail.com',
        'password' => 'Kh4meo!2026',
        'remember' => $remember,
    ])->assertOk()->assertJsonPath('two_factor_required', true);

    return Mail::sent(LoginCodeMail::class)->last()->code;
}

function wrongLoginCode(string $code): string
{
    return $code === '000000' ? '000001' : '000000';
}

it('emails a 6-digit log in code to a verified account', function () {
    verifiedAccount();
    startLogIn();

    Mail::assertSent(LoginCodeMail::class, fn ($mail) => $mail->hasTo('jane.cruz@gmail.com')
        && preg_match('/^\d{6}$/', $mail->code) === 1);
    Mail::assertNotSent(VerificationCodeMail::class);
    $this->assertGuest();
});

it('logs in with the right code and returns the user', function () {
    $user = verifiedAccount();
    $code = startLogIn();

    $this->postJson('/api/login/two-factor', ['code' => $code])
        ->assertOk()
        ->assertJsonPath('id', $user->id)
        ->assertJsonPath('email', 'jane.cruz@gmail.com');

    $this->assertAuthenticatedAs($user);
    $this->assertDatabaseCount('login_codes', 0);
});

it('keeps "remember me" from the first step', function () {
    $user = verifiedAccount();
    $code = startLogIn(remember: true);

    $this->postJson('/api/login/two-factor', ['code' => $code])->assertOk();

    expect($user->fresh()->remember_token)->not->toBeNull();
    $this->assertAuthenticatedAs($user);
});

it('counts down wrong codes and then locks the code', function () {
    verifiedAccount();
    $code = startLogIn();
    $wrong = wrongLoginCode($code);

    $this->postJson('/api/login/two-factor', ['code' => $wrong])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'code_invalid')
        ->assertJsonPath('attempts_left', 2);
    $this->postJson('/api/login/two-factor', ['code' => $wrong])->assertJsonPath('attempts_left', 1);
    $this->postJson('/api/login/two-factor', ['code' => $wrong])
        ->assertJsonPath('code', 'too_many_attempts');

    $this->postJson('/api/login/two-factor', ['code' => $code])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'too_many_attempts');
    $this->assertGuest();
});

it('rejects a code older than 10 minutes', function () {
    verifiedAccount();
    $code = startLogIn();

    $this->travel(11)->minutes();

    $this->postJson('/api/login/two-factor', ['code' => $code])
        ->assertUnprocessable()
        ->assertJsonPath('code', 'code_expired');
});

it('answers login_expired when no log in is waiting', function () {
    $this->postJson('/api/login/two-factor', ['code' => '123456'])
        ->assertUnauthorized()
        ->assertExactJson(['message' => 'Log in again.', 'code' => 'login_expired']);

    $this->postJson('/api/login/two-factor/resend')
        ->assertUnauthorized()
        ->assertJsonPath('code', 'login_expired');
});

it('lets a waiting log in expire after 15 minutes', function () {
    verifiedAccount();
    $code = startLogIn();

    $this->travel(16)->minutes();

    $this->postJson('/api/login/two-factor', ['code' => $code])
        ->assertUnauthorized()
        ->assertJsonPath('code', 'login_expired');
});

it('does not finish the log in of an account suspended meanwhile', function () {
    $user = verifiedAccount();
    $code = startLogIn();

    $user->forceFill(['account_status' => User::STATUS_SUSPENDED])->save();

    $this->postJson('/api/login/two-factor', ['code' => $code])->assertUnauthorized();
    $this->assertGuest();
});

it('refuses to resend during the 60 second cooldown', function () {
    verifiedAccount();
    startLogIn();

    $response = $this->postJson('/api/login/two-factor/resend');

    $response->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJsonPath('message', 'Please wait before asking for another code.');
    expect($response->json('retry_after'))->toBeGreaterThan(0)->toBeLessThanOrEqual(60);
    Mail::assertSent(LoginCodeMail::class, 1);
});

it('resends after the cooldown, and only the new code works', function () {
    verifiedAccount();
    $oldCode = startLogIn();

    $this->travel(61)->seconds();

    $this->postJson('/api/login/two-factor/resend')
        ->assertOk()
        ->assertJsonPath('message', 'We sent a new code.')
        ->assertJsonPath('expires_in', 600)
        ->assertJsonPath('resend_in', 60);

    $newCode = Mail::sent(LoginCodeMail::class)->last()->code;

    if ($newCode !== $oldCode) {
        $this->postJson('/api/login/two-factor', ['code' => $oldCode])->assertUnprocessable();
    }
    $this->postJson('/api/login/two-factor', ['code' => $newCode])->assertOk();
});

it('does not email a second code when logging in again within a minute', function () {
    verifiedAccount();
    $code = startLogIn();

    $this->travel(20)->seconds();

    $response = $this->postJson('/api/login', ['email' => 'jane.cruz@gmail.com', 'password' => 'Kh4meo!2026'])
        ->assertOk()
        ->assertJsonPath('two_factor_required', true);

    expect($response->json('resend_in'))->toBeGreaterThan(0)->toBeLessThanOrEqual(40);
    Mail::assertSent(LoginCodeMail::class, 1);
    $this->postJson('/api/login/two-factor', ['code' => $code])->assertOk();
});

it('requires the code field', function () {
    $this->postJson('/api/login/two-factor', [])
        ->assertUnprocessable()
        ->assertJsonPath('errors.code.0', 'Enter the 6-digit code.');
});
