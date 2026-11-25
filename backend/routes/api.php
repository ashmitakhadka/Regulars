
<?php

use App\Http\Controllers\Api\MerchantCustomerController;
use App\Http\Controllers\Api\MerchantDashboardController;
use App\Http\Controllers\Api\MerchantQrCodeController;
use App\Http\Controllers\Api\MerchantRegistrationController;
use App\Http\Controllers\Api\MerchantRewardProgramController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MerchantStampController;
use App\Http\Controllers\Api\MerchantProductController;
use App\Http\Controllers\Api\MerchantVoucherController;

Route::post('/register/merchant', [MerchantRegistrationController::class, 'store']);
Route::post('/login/merchant', [MerchantRegistrationController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/merchant/me',[MerchantDashboardController::class, 'me']);
    Route::put('/merchant/me',[MerchantDashboardController::class, 'updateMe']);
    Route::get('/merchant/dashboard', [MerchantDashboardController::class, 'index']);

    Route::post('/logout/merchant', [MerchantRegistrationController::class, 'logout']);

    //Reward Programs
    Route::get('/merchant/reward-programs', [MerchantRewardProgramController::class, 'getAllPrograms']);
    Route::post('/merchant/reward-programs', [MerchantRewardProgramController::class, 'createProgram']);
    Route::get('/merchant/reward-programs/{id}', [MerchantRewardProgramController::class, 'getProgramDetails']);
    Route::put('/merchant/reward-programs/{id}', [MerchantRewardProgramController::class, 'updateProgram']);
    Route::get('/merchant/reward-programs/{id}/status', [MerchantRewardProgramController::class, 'updateProgramStatus']);
    Route::delete('/merchant/reward-programs/{id}', [MerchantRewardProgramController::class, 'archiveProgram']);

    //Program and Business OR
    Route::post('/merchant/qr-codes/business',[MerchantQrCodeController::class, 'generateBusinessQr']);
    Route::post('/merchant/loyalty-programs/{id}/qr-codes/',[MerchantQrCodeController::class, 'generateProgramQr']);

    //Merchant-Customers
    Route::get('/merchant/customers',[MerchantCustomerController::class, 'getCustomers']);
    Route::post('merchant/customer/enroll',[MerchantCustomerController::class, 'enrollCustomer']);
     Route::get('/merchant/customers/recent-activity', [MerchantCustomerController::class, 'getAllCustomersRecentActivity']);
    Route::get('/merchant/customers/{customer}', [MerchantCustomerController::class, 'getCustomerDetails']);
    Route::get( '/merchant/customers/{customer}/activity', [MerchantCustomerController::class, 'getCustomerActivity']);
   

    //Award stamps
    Route::post('merchant/stamps/award', [MerchantStampController::class, 'awardStamp']);

    // Merchant Products
    Route::get('/merchant/products', [MerchantProductController::class, 'getMerchantProducts']);
    Route::post('/merchant/products', [MerchantProductController::class, 'createProduct']);
    Route::get('/merchant/products/{id}', [MerchantProductController::class, 'getProductDetails']);
    Route::put('/merchant/products/{id}', [MerchantProductController::class, 'updateProduct']);
    Route::delete('/merchant/products/{id}', [MerchantProductController::class, 'deleteProduct']);

    // Voucher Redemption
    Route::get('/merchant/vouchers/stats',   [MerchantVoucherController::class, 'stats']);
    Route::get('/merchant/vouchers',         [MerchantVoucherController::class, 'index']);
    Route::post('/merchant/vouchers/redeem', [MerchantVoucherController::class, 'redeemVoucher']);

});

require __DIR__ . '/api/customer.php';
require __DIR__ . '/api/admin.php';

