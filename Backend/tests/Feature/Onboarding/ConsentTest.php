<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('saves recording consent with the current version', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patchJson('/api/user/consent', ['recording_consent' => true])
        ->assertOk()
        ->assertJsonPath('consent_version', '2026-11')
        ->assertJsonPath('id', $user->id);

    expect($user->fresh()->recording_consent_at)->not->toBeNull();
});

it('keeps the original time when agreeing again to the same version', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->patchJson('/api/user/consent', ['recording_consent' => true]);
    $firstTime = $user->fresh()->recording_consent_at;

    $this->travel(2)->days();
    $this->patchJson('/api/user/consent', ['recording_consent' => true])->assertOk();

    expect($user->fresh()->recording_consent_at->equalTo($firstTime))->toBeTrue();
});

it('withdraws consent and keeps the last version agreed to', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->patchJson('/api/user/consent', ['recording_consent' => true]);

    $this->patchJson('/api/user/consent', ['recording_consent' => false])
        ->assertOk()
        ->assertJsonPath('recording_consent_at', null)
        ->assertJsonPath('consent_version', '2026-11');
});

it('requires a yes or no', function (mixed $value) {
    $this->actingAs(User::factory()->create())
        ->patchJson('/api/user/consent', ['recording_consent' => $value])
        ->assertUnprocessable()
        ->assertJsonPath('errors.recording_consent.0', 'Choose whether you agree.');
})->with([null, 'maybe']);

it('needs a verified email', function () {
    $this->actingAs(User::factory()->unverified()->create())
        ->patchJson('/api/user/consent', ['recording_consent' => true])
        ->assertForbidden()
        ->assertJsonPath('code', 'email_unverified');
});

it('needs a signed-in user', function () {
    $this->patchJson('/api/user/consent', ['recording_consent' => true])->assertUnauthorized();
});
