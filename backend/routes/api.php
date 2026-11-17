
<?php

use App\Http\Controllers\Api\MerchantDashboardController;
use App\Http\Controllers\Api\MerchantRegistrationController;
use App\Http\Controllers\Api\MerchantRewardProgramController;
use Illuminate\Support\Facades\Route;

Route::post('/register/merchant', [MerchantRegistrationController::class, 'store']);
Route::post('/login/merchant', [MerchantRegistrationController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/merchant/me',[MerchantDashboardController::class, 'me']);
    Route::get('/merchant/dashboard', [MerchantDashboardController::class, 'index']);

    Route::post('/logout/merchant', [MerchantRegistrationController::class, 'logout']);

    // Reward Programs
Route::get('/merchant/reward-programs', [MerchantRewardProgramController::class, 'getAllPrograms']);

Route::post('/merchant/reward-programs', [MerchantRewardProgramController::class, 'createProgram']);

Route::get('/merchant/reward-programs/{id}', [MerchantRewardProgramController::class, 'getProgramDetails']);

Route::put('/merchant/reward-programs/{id}', [MerchantRewardProgramController::class, 'updateProgram']);

Route::patch('/merchant/reward-programs/{id}/status', [MerchantRewardProgramController::class, 'updateProgramStatus']);

Route::delete('/merchant/reward-programs/{id}', [MerchantRewardProgramController::class, 'archiveProgram']);

});

require __DIR__ . '/api/customer.php';

