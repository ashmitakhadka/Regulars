
<?php

use App\Http\Controllers\Api\MerchantRegistrationController;
use Illuminate\Support\Facades\Route;

Route::post('/register/merchant', [MerchantRegistrationController::class, 'store']);
Route::post('/login/merchant', [MerchantRegistrationController::class, 'login']);