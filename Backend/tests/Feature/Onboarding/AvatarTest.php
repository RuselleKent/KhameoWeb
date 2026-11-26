<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function () {
    Storage::fake('public');
});

it('stores the photo on the public disk and returns its URL', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)
        ->post('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('me.jpg', 400, 400)], ['Accept' => 'application/json'])
        ->assertOk();

    $path = $user->fresh()->avatar_path;
    Storage::disk('public')->assertExists($path);
    expect($response->json('avatar_url'))->toBe(Storage::disk('public')->url($path));
    $this->getJson('/api/user')->assertJsonPath('avatar_url', $response->json('avatar_url'));
});

it('replaces the old photo', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->post('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('a.png')], ['Accept' => 'application/json']);
    $oldPath = $user->fresh()->avatar_path;

    $this->post('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('b.webp')], ['Accept' => 'application/json'])->assertOk();

    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($user->fresh()->avatar_path);
});

it('refuses other files and photos over 5 MB', function (UploadedFile $file) {
    $this->actingAs(User::factory()->create())
        ->post('/api/user/avatar', ['avatar' => $file], ['Accept' => 'application/json'])
        ->assertUnprocessable()
        ->assertJsonPath('errors.avatar.0', 'Upload a JPG, PNG or WEBP up to 5 MB.');
})->with([
    'gif' => fn () => UploadedFile::fake()->image('a.gif'),
    'pdf' => fn () => UploadedFile::fake()->create('a.pdf', 100, 'application/pdf'),
    'too big' => fn () => UploadedFile::fake()->image('a.jpg')->size(5121),
]);

it('asks for a photo when none is sent', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/user/avatar', [])
        ->assertUnprocessable()
        ->assertJsonPath('errors.avatar.0', 'Choose a photo.');
});

it('removes the photo, also when there is none', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->post('/api/user/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg')], ['Accept' => 'application/json']);
    $path = $user->fresh()->avatar_path;

    $this->deleteJson('/api/user/avatar')->assertOk()->assertExactJson(['avatar_url' => null]);
    Storage::disk('public')->assertMissing($path);
    expect($user->fresh()->avatar_path)->toBeNull();

    $this->deleteJson('/api/user/avatar')->assertOk()->assertExactJson(['avatar_url' => null]);
});
