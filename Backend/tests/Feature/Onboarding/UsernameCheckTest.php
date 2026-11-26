<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('says whether a username is free, ignoring case', function () {
    User::factory()->create(['username' => 'Jane_Cruz']);

    $this->actingAs(User::factory()->create())
        ->getJson('/api/usernames/check?username=jane_cruz')
        ->assertOk()
        ->assertExactJson(['available' => false]);

    $this->getJson('/api/usernames/check?username=jane_cruz2')->assertExactJson(['available' => true]);
});

it('counts the user’s own username as free', function () {
    $user = User::factory()->create(['username' => 'jane_cruz']);

    $this->actingAs($user)->getJson('/api/usernames/check?username=JANE_CRUZ')->assertExactJson(['available' => true]);
});

it('rejects a username with the wrong length or characters', function (string $username) {
    $this->actingAs(User::factory()->create())
        ->getJson('/api/usernames/check?username='.urlencode($username))
        ->assertUnprocessable()
        ->assertJsonPath('errors.username.0', 'Use 3–20 letters, numbers or underscores.');
})->with(['ab', 'jane.cruz', 'twenty_one_characters', '']);
