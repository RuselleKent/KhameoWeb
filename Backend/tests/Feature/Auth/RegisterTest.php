<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

uses(RefreshDatabase::class);

/**
 * @param  array<string, mixed>  $overrides
 * @return array<string, mixed>
 */
function validRegistration(array $overrides = []): array
{
    return array_merge([
        'name' => 'Jane Cruz',
        'email' => 'jane.cruz@gmail.com',
        'password' => 'Kh4meo!2026',
        'password_confirmation' => 'Kh4meo!2026',
        'confirmed_age' => true,
        'accepted_terms' => true,
    ], $overrides);
}

it('creates an account, signs the user in and returns the contract shape', function () {
    $response = $this->postJson('/api/register', validRegistration());

    $response->assertCreated()
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'email_verified_at', 'onboarded_at', 'created_at', 'updated_at'],
            'verification' => ['expires_in', 'resend_in'],
        ])
        ->assertJsonPath('user.email', 'jane.cruz@gmail.com')
        ->assertJsonPath('user.email_verified_at', null)
        ->assertJsonPath('user.onboarded_at', null)
        ->assertJsonMissingPath('user.password');

    $this->assertAuthenticated();
});

it('stores a hashed password and the time the terms were accepted', function () {
    $this->postJson('/api/register', validRegistration())->assertCreated();

    $user = User::where('email', 'jane.cruz@gmail.com')->firstOrFail();

    expect($user->password)->not->toBe('Kh4meo!2026')
        ->and(Hash::check('Kh4meo!2026', $user->password))->toBeTrue()
        ->and($user->terms_accepted_at)->not->toBeNull();
});

it('saves the email trimmed and lowercase', function () {
    $this->postJson('/api/register', validRegistration(['email' => '  Jane.Cruz@Gmail.com ']))
        ->assertCreated();

    $this->assertDatabaseHas('users', ['email' => 'jane.cruz@gmail.com']);
});

it('rejects an email that is already registered, whatever its letter case', function () {
    User::factory()->create(['email' => 'jane.cruz@gmail.com']);

    $this->postJson('/api/register', validRegistration(['email' => 'Jane.Cruz@gmail.com']))
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'This email is already registered.');

    $this->assertGuest();
});

it('returns the contract messages for invalid input', function (array $overrides, string $field, string $message) {
    $this->postJson('/api/register', validRegistration($overrides))
        ->assertUnprocessable()
        ->assertJsonPath("errors.{$field}.0", $message);

    $this->assertDatabaseCount('users', 0);
})->with([
    'missing name' => [['name' => ''], 'name', 'Enter your full name.'],
    'missing email' => [['email' => ''], 'email', 'Enter your email.'],
    'invalid email' => [['email' => 'not-an-email'], 'email', 'Enter a valid email address.'],
    'short password' => [['password' => 'abc', 'password_confirmation' => 'abc'], 'password', 'Use at least 8 characters.'],
    'password mismatch' => [['password_confirmation' => 'Different123'], 'password_confirmation', 'Passwords don’t match.'],
    'under 18' => [['confirmed_age' => false], 'confirmed_age', 'You must be 18 or older to use Khameo.'],
    'terms not accepted' => [['accepted_terms' => false], 'accepted_terms', 'Please accept the terms to continue.'],
]);