<?php

use App\Http\Controllers\Api\Customer\CustomerAuthController;
use App\Http\Controllers\Api\Customer\CustomerBusinessController;
use Illuminate\Support\Facades\Route;

// Public customer authentication endpoints
Route::post('/register/customer', [CustomerAuthController::class, 'register']);
Route::post('/login/customer', [CustomerAuthController::class, 'login']);

// Authenticated customer endpoints
Route::middleware(['auth:sanctum', 'customer'])->group(function () {
    Route::post('/logout/customer', [CustomerAuthController::class, 'logout']);
    Route::get('/customer/me', [CustomerAuthController::class, 'me']);

    // Customer Business Directory & Program Details
    Route::get('/customer/businesses', [CustomerBusinessController::class, 'index']);
    Route::get('/customer/businesses/{slug}', [CustomerBusinessController::class, 'show']);
    Route::get('/customer/programs/{id}', [CustomerBusinessController::class, 'showProgram']);
});

