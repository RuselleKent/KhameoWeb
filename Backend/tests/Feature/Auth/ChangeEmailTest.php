<?php

use App\Mail\VerificationCodeMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;

uses(RefreshDatabase::class);

beforeEach(function () {
    Mail::fake();
});

function unverifiedAccount(): User
{
    return User::factory()->unverified()->create(['email' => 'jane.typo@gmail.com']);
}

it('changes the email, sends a new code there and returns the timers', function () {
    $user = unverifiedAccount();

    $this->actingAs($user)
        ->postJson('/api/email/change', ['email' => '  Jane.Cruz@Gmail.com '])
        ->assertOk()
        ->assertJsonPath('user.email', 'jane.cruz@gmail.com')
        ->assertJsonPath('user.email_verified_at', null)
        ->assertJsonPath('verification', ['expires_in' => 600, 'resend_in' => 60]);

    expect($user->fresh()->email)->toBe('jane.cruz@gmail.com');
    Mail::assertSent(VerificationCodeMail::class, fn ($mail) => $mail->hasTo('jane.cruz@gmail.com'));
});

it('verifies the new email with the new code', function () {
    $user = unverifiedAccount();

    $this->actingAs($user)->postJson('/api/email/change', ['email' => 'jane.cruz@gmail.com'])->assertOk();
    $code = Mail::sent(VerificationCodeMail::class)->last()->code;

    $this->postJson('/api/email/verify', ['code' => $code])->assertOk();

    expect($user->fresh()->hasVerifiedEmail())->toBeTrue();
});

it('refuses an email another account uses', function () {
    User::factory()->create(['email' => 'taken@gmail.com']);

    $this->actingAs(unverifiedAccount())
        ->postJson('/api/email/change', ['email' => 'taken@gmail.com'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', 'This email is already registered.');

    Mail::assertNothingSent();
});

it('returns the contract messages for a bad email', function (string $email, string $message) {
    $this->actingAs(unverifiedAccount())
        ->postJson('/api/email/change', ['email' => $email])
        ->assertUnprocessable()
        ->assertJsonPath('errors.email.0', $message);
})->with([
    'missing' => ['', 'Enter your new email.'],
    'format' => ['not-an-email', 'Enter a valid email address.'],
    'same as now' => ['jane.typo@gmail.com', 'That’s already your email.'],
]);

it('refuses once the email is verified', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/email/change', ['email' => 'new@gmail.com'])
        ->assertForbidden()
        ->assertJsonPath('code', 'already_verified');
});

it('requires a signed-in user', function () {
    $this->postJson('/api/email/change', ['email' => 'new@gmail.com'])->assertUnauthorized();
});
