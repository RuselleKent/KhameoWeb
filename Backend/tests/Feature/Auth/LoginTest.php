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

it('logs in with the right credentials and returns the user object', function () {
    accountWithPassword();

    $this->postJson('/api/login', validLogin())
        ->assertOk()
        ->assertJsonStructure(['id', 'name', 'email', 'email_verified_at', 'onboarded_at', 'created_at', 'updated_at'])
        ->assertJsonPath('email', 'jane.cruz@gmail.com')
        ->assertJsonMissingPath('password')
        ->assertJsonMissingPath('is_admin');

    $this->assertAuthenticated();
});

it('lets an unverified user log in', function () {
    accountWithPassword(['email_verified_at' => null]);

    $this->postJson('/api/login', validLogin())
        ->assertOk()
        ->assertJsonPath('email_verified_at', null);
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
        ->assertJsonStructure(['id', 'name', 'email', 'email_verified_at', 'onboarded_at', 'created_at', 'updated_at'])
        ->assertJsonMissingPath('host_status')
        ->assertJsonMissingPath('is_admin');
});

it('answers 401 when nobody is signed in', function () {
    $this->getJson('/api/user')->assertUnauthorized();
});