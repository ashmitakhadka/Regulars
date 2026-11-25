<?php

use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminMerchantController;
use App\Http\Controllers\Api\Admin\AdminStatsController;
use Illuminate\Support\Facades\Route;

// Public Admin Auth
Route::post('/login/admin', [AdminAuthController::class, 'login']);

// Protected Superadmin Routes
Route::middleware(['auth:sanctum', 'admin', 'throttle:60,1'])->group(function () {
    Route::post('/logout/admin', [AdminAuthController::class, 'logout']);
    Route::get('/admin/me', [AdminAuthController::class, 'me']);

    // Platform statistics
    Route::get('/admin/stats', [AdminStatsController::class, 'stats']);

    // Merchant directory and management
    Route::get('/admin/merchants', [AdminMerchantController::class, 'index']);
    Route::get('/admin/merchants/{id}', [AdminMerchantController::class, 'show']);
    Route::patch('/admin/merchants/{id}/status', [AdminMerchantController::class, 'updateStatus']);
    Route::patch('/admin/merchants/{id}/pro', [AdminMerchantController::class, 'updatePro']);
});
