<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * @param  array<string, mixed>  $attributes
 */
function accountWithPassword(array $attributes = []): User
{
    return User::factory()->create(array_merge([
        'email' => 'jane.cruz@gmail.com',
        'password' => 'Kh4meo!2026',
    ], $attributes));
}

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validLogin(array $overrides = []): array
{
    return array_merge([
        'email' => 'jane.cruz@gmail.com',
        'password' => 'Kh4meo!2026',
        'remember' => false,
    ], $overrides);
}

it('asks a verified account for an emailed code instead of logging in', function () {
    accountWithPassword();

    $this->postJson('/api/login', validLogin())
        ->assertOk()
        ->assertExactJson([
            'two_factor_required' => true,
            'email' => 'jane.cruz@gmail.com',
            'expires_in' => 600,
            'resend_in' => 60,
        ]);

    $this->assertGuest();
});

it('logs an unverified user in right away and returns the user object', function () {
    accountWithPassword(['email_verified_at' => null]);

    $this->postJson('/api/login', validLogin())
        ->assertOk()
        ->assertJsonPath('email', 'jane.cruz@gmail.com')
        ->assertJsonPath('email_verified_at', null)
        ->assertJsonMissingPath('password')
        ->assertJsonMissingPath('is_admin');

    $this->assertAuthenticated();
});

it('ignores letter case and spaces in the email', function () {
    accountWithPassword();

    $this->postJson('/api/login', validLogin(['email' => '  Jane.Cruz@Gmail.com ']))->assertOk();
});

it('says when no account has the email', function () {
    $this->postJson('/api/login', validLogin(['email' => 'nobody@gmail.com']))
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'We couldn’t find an account with this email.');

    $this->assertGuest();
});

it('says when the password is wrong', function () {
    accountWithPassword();

    $this->postJson('/api/login', validLogin(['password' => 'WrongPassword1']))
        ->assertUnprocessable()
        ->assertJsonPath('errors.password.0', 'That password isn’t right. Try again, or reset it.');

    $this->assertGuest();
});

it('returns the contract messages for missing fields', function (array $overrides, string $field, string $message) {
    $this->postJson('/api/login', validLogin($overrides))
        ->assertUnprocessable()
        ->assertJsonPath("errors.{$field}.0", $message);
})->with([
    'missing email' => [['email' => ''], 'email', 'Enter your email.'],
    'invalid email' => [['email' => 'not-an-email'], 'email', 'Enter a valid email address.'],
    'missing password' => [['password' => ''], 'password', 'Enter your password.'],
]);

it('pauses log in for 15 minutes after 5 failed tries', function () {
    accountWithPassword();

    foreach (range(1, 5) as $try) {
        $this->postJson('/api/login', validLogin(['password' => 'WrongPassword1']))->assertUnprocessable();
    }

    $response = $this->postJson('/api/login', validLogin());

    $response->assertStatus(429)
        ->assertHeader('Retry-After')
        ->assertJsonPath('message', 'Too many requests.');

    expect($response->json('retry_after'))->toBeGreaterThan(0)->toBeLessThanOrEqual(900);
    $this->assertGuest();

    $this->travel(16)->minutes();

    $this->postJson('/api/login', validLogin())->assertOk();
});

it('does not carry earlier failed tries over after a successful log in', function () {
    accountWithPassword();

    foreach (range(1, 4) as $try) {
        $this->postJson('/api/login', validLogin(['password' => 'WrongPassword1']))->assertUnprocessable();
    }

    $this->postJson('/api/login', validLogin())->assertOk();

    foreach (range(1, 4) as $try) {
        $this->postJson('/api/login', validLogin(['password' => 'WrongPassword1']))->assertUnprocessable();
    }
});

it('does not log in a suspended account', function () {
    accountWithPassword(['account_status' => User::STATUS_SUSPENDED]);

    $this->postJson('/api/login', validLogin())->assertForbidden();

    $this->assertGuest();
});

it('logs the user out', function () {
    $this->actingAs(accountWithPassword())
        ->postJson('/api/logout')
        ->assertNoContent();

    $this->assertGuest('web');
});

it('requires a signed-in user to log out', function () {
    $this->postJson('/api/logout')->assertUnauthorized();
});

it('returns the signed-in user', function () {
    $user = accountWithPassword();

    $this->actingAs($user)
        ->getJson('/api/user')
        ->assertOk()
        ->assertJsonPath('id', $user->id)
        ->assertJsonPath('email', 'jane.cruz@gmail.com')
        ->assertJsonStructure([
            'id', 'name', 'email', 'email_verified_at', 'recording_consent_at', 'consent_version', 'onboarded_at',
            'onboarding_path', 'display_name', 'username', 'bio', 'roles', 'avatar_url', 'two_factor_confirmed_at',
            'host_status', 'created_at', 'updated_at',
        ])
        ->assertJsonPath('host_status', 'none')
        ->assertJsonPath('roles', [])
        ->assertJsonMissingPath('avatar_path')
        ->assertJsonMissingPath('google_id')
        ->assertJsonMissingPath('is_admin');
});

it('answers 401 when nobody is signed in', function () {
    $this->getJson('/api/user')->assertUnauthorized();
});
