<?php

use App\Http\Controllers\Auth\CurrentUserController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResendVerificationCodeController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\PingController;
use Illuminate\Support\Facades\Route;

// Create account: /api/register → RegisterController
Route::post('/register', RegisterController::class)->middleware('throttle:6,1');

// Log in (the controller also locks out repeated failed tries)
Route::post('/login', LoginController::class)->middleware('throttle:20,1');

// Routes for signed-in users
Route::middleware('auth:sanctum')->group(function () {
    // Who is signed in (the app calls this on every page load)
    Route::get('/user', CurrentUserController::class);

    Route::post('/logout', LogoutController::class);

    // Email verification code
    Route::post('/email/verify', VerifyEmailController::class)->middleware('throttle:10,1');
    Route::post('/email/resend', ResendVerificationCodeController::class)->middleware('throttle:6,1');
});

// Test route: /api/ping → PingController@index
Route::get('/ping', [PingController::class, 'index']);