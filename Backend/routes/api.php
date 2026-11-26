<?php

use App\Http\Controllers\Auth\ChangeEmailController;
use App\Http\Controllers\Auth\CurrentUserController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LoginTwoFactorController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ResendLoginCodeController;
use App\Http\Controllers\Auth\ResendVerificationCodeController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Onboarding\CheckUsernameController;
use App\Http\Controllers\Onboarding\CompleteOnboardingController;
use App\Http\Controllers\Onboarding\RemoveAvatarController;
use App\Http\Controllers\Onboarding\SaveConsentController;
use App\Http\Controllers\Onboarding\UploadAvatarController;
use App\Http\Controllers\PingController;
use App\Http\Middleware\EnsureEmailIsVerified;
use Illuminate\Support\Facades\Route;

// Create account: /api/register → RegisterController
Route::post('/register', RegisterController::class)->middleware('throttle:6,1');

// Log in (the controller also locks out repeated failed tries). Verified accounts then enter an emailed code.
Route::post('/login', LoginController::class)->middleware('throttle:20,1');
Route::post('/login/two-factor', LoginTwoFactorController::class)->middleware('throttle:10,1');
Route::post('/login/two-factor/resend', ResendLoginCodeController::class)->middleware('throttle:6,1');

// Forgot / reset password (Laravel's password broker; reset never signs in)
Route::post('/forgot-password', ForgotPasswordController::class)->middleware('throttle:6,1');
Route::post('/reset-password', ResetPasswordController::class)->middleware('throttle:6,1');

// Routes for signed-in users
Route::middleware('auth:sanctum')->group(function () {
    // Who is signed in (the app calls this on every page load)
    Route::get('/user', CurrentUserController::class);

    Route::post('/logout', LogoutController::class);

    // Email verification code
    Route::post('/email/verify', VerifyEmailController::class)->middleware('throttle:10,1');
    Route::post('/email/resend', ResendVerificationCodeController::class)->middleware('throttle:6,1');
    // "Wrong email? Change it" (only before verifying)
    Route::post('/email/change', ChangeEmailController::class)->middleware('throttle:6,1');

    // Onboarding (docs/api-onboarding.md): verified email only
    Route::middleware(EnsureEmailIsVerified::class)->group(function () {
        Route::patch('/user/consent', SaveConsentController::class);
        Route::post('/user/avatar', UploadAvatarController::class)->middleware('throttle:10,1');
        Route::delete('/user/avatar', RemoveAvatarController::class);
        Route::get('/usernames/check', CheckUsernameController::class)->middleware('throttle:60,1');
        Route::patch('/user/onboarding', CompleteOnboardingController::class);
    });
});

// Test route: /api/ping → PingController@index
Route::get('/ping', [PingController::class, 'index']);
