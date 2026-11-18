<?php

use App\Http\Controllers\Api\Customer\CustomerAuthController;
use Illuminate\Support\Facades\Route;

// Public customer authentication endpoints
Route::post('/register/customer', [CustomerAuthController::class, 'register']);
Route::post('/login/customer', [CustomerAuthController::class, 'login']);

// Authenticated customer endpoints
Route::middleware(['auth:sanctum', 'customer'])->group(function () {
    Route::post('/logout/customer', [CustomerAuthController::class, 'logout']);
    Route::get('/customer/me', [CustomerAuthController::class, 'me']);
});

