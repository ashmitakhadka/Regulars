
<?php

use Illuminate\Support\Facades\Route;

Route::get('/connection-test', function () {
    return response()->json([
        'success' => true,
        'message' => 'Hello from Laravel! Regulars API is working.',
    ]);
});
