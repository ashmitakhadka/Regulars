<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use App\Models\VoucherRedemption;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MerchantVoucherController extends Controller
{
    public function redeemVoucher(Request $request)
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255'],
        ]);

        $user = $request->user();

        if (!$user || $user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Only merchants can redeem vouchers.',
            ], 403);
        }

        $merchant = $user->merchant()->first();

        if (!$merchant || $merchant->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Active merchant account not found.',
            ], 403);
        }

        return DB::transaction(function () use ($validated, $merchant, $user) {

            $voucher = Voucher::where('code', $validated['code'])
                ->where('merchant_id', $merchant->id)
                ->lockForUpdate()
                ->first();

            if (!$voucher) {
                return response()->json([
                    'success' => false,
                    'message' => 'Voucher not found.',
                ], 404);
            }

            if ($voucher->status !== 'active' || $voucher->redeemed_at !== null) {
                return response()->json([
                    'success' => false,
                    'message' => 'This voucher has already been redeemed or is inactive.',
                ], 422);
            }

            $timezone = $merchant->timezone ?? 'Asia/Kathmandu';
            $now = now($timezone)->utc();

            if ($voucher->expires_at->lte($now)) {
                $voucher->update([
                    'status' => 'expired',
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'This voucher has expired.',
                ], 422);
            }

            $voucher->update([
                'status' => 'redeemed',
                'redeemed_at' => $now,
            ]);

            VoucherRedemption::create([
                'voucher_id' => $voucher->id,
                'merchant_id' => $merchant->id,
                'redeemed_by' => $user->id,
                'redeemed_at' => $now,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Voucher redeemed successfully.',
                'data' => [
                    'voucher_id' => $voucher->id,
                    'code' => $voucher->code,
                    'customer_id' => $voucher->customer_id,
                    'reward_title' => $voucher->reward_title,
                    'reward_type' => $voucher->reward_type,
                    'reward_value' => $voucher->reward_value,
                    'status' => $voucher->status,
                    'redeemed_at' => $voucher->redeemed_at,
                ],
            ], 200);
        });
    }
}
