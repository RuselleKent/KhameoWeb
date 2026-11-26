<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

/**
 * @return array<string, mixed>
 */
function onboardingAnswers(array $profile = [], array $overrides = []): array
{
    return array_merge([
        'path' => 'personal',
        'goals' => ['fewer_filler_words', 'steady_pace'],
        'profile' => array_merge([
            'display_name' => 'Jane Cruz',
            'username' => 'jane_cruz',
            'bio' => 'Practicing for my thesis defense.',
            'roles' => [
                ['name' => 'Student', 'audiences' => ['Classmates', 'Thesis Panel']],
                ['name' => 'Real estate agent', 'audiences' => []],
            ],
        ], $profile),
    ], $overrides);
}

it('saves every answer and marks onboarding done', function () {
    $user = User::factory()->create(['onboarded_at' => null]);

    $this->actingAs($user)
        ->patchJson('/api/user/onboarding', onboardingAnswers())
        ->assertOk()
        ->assertJsonPath('onboarding_path', 'personal')
        ->assertJsonPath('display_name', 'Jane Cruz')
        ->assertJsonPath('username', 'jane_cruz')
        ->assertJsonPath('bio', 'Practicing for my thesis defense.')
        ->assertJsonPath('roles', [
            ['name' => 'Student', 'audiences' => ['Classmates', 'Thesis Panel']],
            ['name' => 'Real estate agent', 'audiences' => []],
        ]);

    $user->refresh();
    expect($user->onboarded_at)->not->toBeNull()
        ->and($user->goals)->toBe(['fewer_filler_words', 'steady_pace']);
});

it('tidies spaces and stores an empty bio as null', function () {
    $this->actingAs(User::factory()->create())
        ->patchJson('/api/user/onboarding', onboardingAnswers([
            'display_name' => '  Jane   Cruz ',
            'bio' => '   ',
            'roles' => [['name' => '  Event   host ', 'audiences' => [' Wedding  Guests ']]],
        ]))
        ->assertOk()
        ->assertJsonPath('display_name', 'Jane Cruz')
        ->assertJsonPath('bio', null)
        ->assertJsonPath('roles.0', ['name' => 'Event host', 'audiences' => ['Wedding Guests']]);
});

it('refuses a username someone else has, ignoring case', function () {
    User::factory()->create(['username' => 'Jane_Cruz']);

    $this->actingAs(User::factory()->create())
        ->patchJson('/api/user/onboarding', onboardingAnswers())
        ->assertUnprocessable()
        ->assertJsonPath('errors', ['profile.username' => ['That username is taken.']]);
});

it('returns the contract messages', function (array $answers, string $field, string $message) {
    $response = $this->actingAs(User::factory()->create())
        ->patchJson('/api/user/onboarding', $answers)
        ->assertUnprocessable();

    // Error keys contain dots (profile.roles.0.name), so read them without a dotted path
    expect($response->json('errors')[$field][0] ?? null)->toBe($message);
})->with([
    'unknown path' => [onboardingAnswers([], ['path' => 'boss']), 'path', 'Choose how you want to use Khameo.'],
    'four goals' => [onboardingAnswers([], ['goals' => ['steady_pace', 'confident_tone', 'clear_opening', 'strong_closing']]), 'goals', 'Choose up to 3.'],
    'unknown goal' => [onboardingAnswers([], ['goals' => ['juggling']]), 'goals.0', 'Choose up to 3.'],
    'no display name' => [onboardingAnswers(['display_name' => '']), 'profile.display_name', 'Enter a display name.'],
    'long display name' => [onboardingAnswers(['display_name' => str_repeat('a', 81)]), 'profile.display_name', 'Use up to 80 characters.'],
    'bad username' => [onboardingAnswers(['username' => 'j.c']), 'profile.username', 'Use 3–20 letters, numbers or underscores.'],
    'long bio' => [onboardingAnswers(['bio' => str_repeat('a', 161)]), 'profile.bio', 'Use up to 160 characters.'],
    'six roles' => [onboardingAnswers(['roles' => array_map(fn ($n) => ['name' => "Role {$n}", 'audiences' => []], range(1, 6))]), 'profile.roles', 'Add up to 5 roles.'],
    'empty role' => [onboardingAnswers(['roles' => [['name' => '', 'audiences' => []]]]), 'profile.roles.0.name', 'Use 1–40 characters for a role.'],
    'long role' => [onboardingAnswers(['roles' => [['name' => str_repeat('a', 41), 'audiences' => []]]]), 'profile.roles.0.name', 'Use 1–40 characters for a role.'],
    'repeated role' => [onboardingAnswers(['roles' => [['name' => 'Student', 'audiences' => []], ['name' => 'student', 'audiences' => []]]]), 'profile.roles.1.name', 'You already added this role.'],
    '21 audiences' => [onboardingAnswers(['roles' => [['name' => 'Student', 'audiences' => array_map(fn ($n) => "Audience {$n}", range(1, 21))]]]), 'profile.roles.0.audiences', 'Check up to 20 audiences per role.'],
    'long audience' => [onboardingAnswers(['roles' => [['name' => 'Student', 'audiences' => [str_repeat('a', 41)]]]]), 'profile.roles.0.audiences.0', 'Use 1–40 characters for an audience.'],
]);

it('changes nothing when sent again after onboarding', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->patchJson('/api/user/onboarding', onboardingAnswers())->assertOk();

    $this->patchJson('/api/user/onboarding', onboardingAnswers(['username' => 'someone_else'], ['path' => 'host']))
        ->assertOk()
        ->assertJsonPath('username', 'jane_cruz')
        ->assertJsonPath('onboarding_path', 'personal');
});

it('needs a verified email', function () {
    $this->actingAs(User::factory()->unverified()->create())
        ->patchJson('/api/user/onboarding', onboardingAnswers())
        ->assertForbidden()
        ->assertJsonPath('code', 'email_unverified');
});
