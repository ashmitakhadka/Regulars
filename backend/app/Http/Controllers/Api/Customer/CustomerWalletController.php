<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Services\Customer\CustomerWalletService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerWalletController extends Controller
{
    public function __construct(
        protected CustomerWalletService $walletService
    ) {}

    /**
     * Display all active stamp cards and summary for the authenticated customer.
     */
    public function index(Request $request): JsonResponse
    {
        $customerId = $request->user()->id;
        $walletData = $this->walletService->getWallet($customerId);

        return response()->json([
            'success' => true,
            'data' => $walletData,
            'message' => 'Wallet retrieved successfully.',
        ]);
    }

    /**
     * Display stamp card details, reward snapshot, and visit history.
     * Returns 404 if the card does not exist or belongs to another customer.
     */
    public function show(Request $request, string|int $id): JsonResponse
    {
        $customerId = $request->user()->id;
        $card = $this->walletService->getCardDetail((int) $id, $customerId);

        if (!$card) {
            return response()->json([
                'success' => false,
                'message' => 'Stamp card not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $card,
            'message' => 'Stamp card retrieved successfully.',
        ]);
    }
}
