<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\MerchantQrCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class MerchantQrCodeController extends Controller
{
    /**
     * Generate or retrieve the merchant's stable business QR.
     */
    public function generateBusinessQr(): JsonResponse
    {
        $merchant = Merchant::where('user_id', Auth::id())
            ->firstOrFail();

        $qrCode = $merchant->qrCodes()
            ->firstOrNew(['type' => 'business']);

        $qrCode->merchant_id = $merchant->id;
        $qrCode->loyalty_program_id = null;
        $qrCode->type = 'business';
        $qrCode->is_active = true;
        $qrCode->expires_at = null;

        // A temporary valid hash allows the new record to be saved
        // before its ID is available.
        if (!$qrCode->exists) {
            $qrCode->token_hash = hash('sha256', bin2hex(random_bytes(32)));
        }

        $qrCode->save();

        $token = $this->stableToken($qrCode);
        $tokenHash = hash('sha256', $token);

        if (!hash_equals((string) $qrCode->token_hash, $tokenHash)) {
            $qrCode->token_hash = $tokenHash;
            $qrCode->last_refreshed_at = now();
            $qrCode->save();
        }

        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');

        return response()->json([
            'success' => true,
            'message' => 'Business QR retrieved successfully.',
            'data' => [
                'qr_url' => $frontendUrl . '/join/' . $merchant->slug. '?qr=' . $token,
                'type' => 'business',
                'business_name' => $merchant->business_name,
            ],
        ]);
    }

    /**
     * Generate or retrieve a stable QR for a loyalty program.
     */
    public function generateProgramQr(int $id): JsonResponse
    {
        $merchant = Merchant::where('user_id', Auth::id())
            ->firstOrFail();

        $program = $merchant->loyaltyPrograms()->findOrFail($id);

        if ($program->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'QR codes can only be generated for active programs.',
            ], 422);
        }

        $qrCode = $program->qrCodes()->firstOrNew();

        $qrCode->merchant_id = $merchant->id;
        $qrCode->type = 'program';
        $qrCode->is_active = true;
        $qrCode->expires_at = null;

        if (!$qrCode->exists) {
            $qrCode->token_hash = hash('sha256', bin2hex(random_bytes(32)));
        }

        $qrCode->save();

        $token = $this->stableToken($qrCode);
        $tokenHash = hash('sha256', $token);

        if (!hash_equals((string) $qrCode->token_hash, $tokenHash)) {
            $qrCode->token_hash = $tokenHash;
            $qrCode->last_refreshed_at = now();
            $qrCode->save();
        }

        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');

        return response()->json([
            'success' => true,
            'message' => 'Program QR retrieved successfully.',
            'data' => [
                'qr_url' => $frontendUrl . '/businesses/' . $merchant->slug
                    . '/programs/' . $program->id . '/join?qr=' . $token,
                'type' => 'program',
                'loyalty_program_id' => $program->id,
            ],
        ]);
    }

    /**
     * Recreate the same token using the QR record ID and application key.
     */
    private function stableToken(MerchantQrCode $qrCode): string
    {
        return hash_hmac(
            'sha256',
            'merchant-qr:' . $qrCode->id,
            config('app.key')
        );
    }
}
