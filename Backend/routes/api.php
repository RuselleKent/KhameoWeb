<?php

use App\Http\Controllers\PingController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Returns the logged-in user (we'll use this later for login)
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Test route: /api/ping → PingController@index
Route::get('/ping', [PingController::class, 'index']);