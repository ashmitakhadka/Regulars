<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Merchant;
use App\Models\MerchantQrCode;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\JsonResponse;

class MerchantQrCodeController extends Controller
{
    public function generateBusinessQr(): JsonResponse
    {
        $merchant = Merchant::where('user_id', Auth::id())
            ->firstOrFail();

        $token = bin2hex(random_bytes(32));

        $qrCode = $merchant->qrCodes()
            ->where('type', 'business')
            ->first();

        if (!$qrCode) {
            $qrCode = new MerchantQrCode();
            $qrCode->merchant_id = $merchant->id;
        }

        $qrCode->loyalty_program_id = null;
        $qrCode->type = 'business';
        $qrCode->token_hash = hash('sha256', $token);
        $qrCode->is_active = true;
        $qrCode->expires_at = null;
        $qrCode->last_refreshed_at = now();
        $qrCode->save();

        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        return response()->json([
            'success' => true,
            'message' => 'Business QR generated successfully.',
            'data' => [
                'qr_url' => $frontendUrl . '/businesses/' . $merchant->slug . '/join?qr=' . $token,
                'type' => 'business',
            ],
        ]);
    }

    public function generateProgramQr(int $id): JsonResponse
    {
        $merchant = Merchant::where('user_id', Auth::id())
            ->firstOrFail();

        // Only find programs belonging to this merchant.
        $program = $merchant->loyaltyPrograms()->findOrFail($id);

        if ($program->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'QR codes can only be generated for active programs.',
            ], 422);
        }

        $token = bin2hex(random_bytes(32));

      $qrCode = $program->qrCodes()->firstOrNew();

        $qrCode->merchant_id = $merchant->id;
        $qrCode->type = 'program';
        $qrCode->token_hash = hash('sha256', $token);
        $qrCode->is_active = true;
        $qrCode->expires_at = null;
        $qrCode->last_refreshed_at = now();
        $qrCode->save();

        $frontendUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');

        return response()->json([
            'success' => true,
            'message' => 'Program QR generated successfully.',
            'data' => [
                'qr_url' => $frontendUrl . '/businesses/' . $merchant->slug
                    . '/programs/' . $program->id . '/join?qr=' . $token,
                'type' => 'program',
                'loyalty_program_id' => $program->id,
            ],
        ]);
    }
}
