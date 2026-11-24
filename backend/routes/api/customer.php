<?php

use App\Http\Controllers\Api\Customer\CustomerAuthController;
use App\Http\Controllers\Api\Customer\CustomerBusinessController;
use App\Http\Controllers\Api\Customer\CustomerJoinController;
use App\Http\Controllers\Api\Customer\CustomerProfileController;
use App\Http\Controllers\Api\Customer\CustomerVoucherController;
use App\Http\Controllers\Api\Customer\CustomerWalletController;
use Illuminate\Support\Facades\Route;

// Public customer authentication endpoints
Route::post('/register/customer', [CustomerAuthController::class, 'register']);
Route::post('/login/customer', [CustomerAuthController::class, 'login']);

// Authenticated customer endpoints
Route::middleware(['auth:sanctum', 'customer'])->group(function () {
    Route::post('/logout/customer', [CustomerAuthController::class, 'logout']);
    Route::get('/customer/me', [CustomerAuthController::class, 'me']);

    // Customer Profile
    Route::get('/customer/profile', [CustomerProfileController::class, 'show']);
    Route::patch('/customer/profile', [CustomerProfileController::class, 'update'])->middleware('throttle:20,1');

    // Customer Business Directory & Program Details
    Route::get('/customer/businesses', [CustomerBusinessController::class, 'index']);
    Route::get('/customer/businesses/{slug}', [CustomerBusinessController::class, 'show']);
    Route::get('/customer/programs/{id}', [CustomerBusinessController::class, 'showProgram']);

    // Customer Wallet & Stamp Cards
    Route::get('/customer/wallet', [CustomerWalletController::class, 'index']);
    Route::get('/customer/stamp-cards/{id}', [CustomerWalletController::class, 'show']);

    // Customer Program Joining (Rate limited to 30 requests per minute)
    Route::middleware('throttle:30,1')->group(function () {
        Route::post('/customer/programs/join', [CustomerJoinController::class, 'bulkJoin']);
        Route::post('/customer/programs/{id}/join', [CustomerJoinController::class, 'join']);
    });

    // Customer Vouchers
    Route::get('/customer/vouchers', [CustomerVoucherController::class, 'index']);
    Route::get('/customer/vouchers/{id}', [CustomerVoucherController::class, 'show']);
});
