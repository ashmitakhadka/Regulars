<?php

namespace App\Services\Admin;

use App\Models\LoyaltyProgram;
use App\Models\Merchant;
use App\Models\StampTransaction;
use App\Models\User;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class AdminStatsService
{
    /**
     * Compute platform-wide statistics.
     * "Last 7 days" = today plus the previous 6 days in Asia/Kathmandu,
     * computed in Asia/Kathmandu, converted to UTC, and compared against stored UTC timestamps.
     */
    public function getStats(): JsonResponse
    {
        // 7-day window boundary (inclusive of today and 6 previous days in Asia/Kathmandu)
        $sevenDaysAgoUtc = Carbon::now('Asia/Kathmandu')->subDays(6)->startOfDay()->utc();

        $merchantsTotal = Merchant::count();
        $merchantsActive = Merchant::where('status', 'active')->count();
        $merchantsSuspended = Merchant::where('status', 'suspended')->count();
        $merchantsPro = Merchant::where('is_pro', true)->count();

        $customersTotal = User::where('role', 'customer')->count();
        $customersNewLast7Days = User::where('role', 'customer')
            ->where('created_at', '>=', $sevenDaysAgoUtc)
            ->count();

        $programsTotal = LoyaltyProgram::count();
        $programsActive = LoyaltyProgram::where('status', 'active')->count();

        $stampsTotal = (int) StampTransaction::sum('stamps_awarded');
        $stampsLast7Days = (int) StampTransaction::where('created_at', '>=', $sevenDaysAgoUtc)
            ->sum('stamps_awarded');

        $vouchersIssuedTotal = Voucher::count();
        $vouchersIssuedLast7Days = Voucher::where('issued_at', '>=', $sevenDaysAgoUtc)->count();

        $vouchersRedeemedTotal = Voucher::whereNotNull('redeemed_at')->count();
        $vouchersRedeemedLast7Days = Voucher::whereNotNull('redeemed_at')
            ->where('redeemed_at', '>=', $sevenDaysAgoUtc)
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'merchants' => [
                    'total' => $merchantsTotal,
                    'active' => $merchantsActive,
                    'suspended' => $merchantsSuspended,
                    'pro' => $merchantsPro,
                ],
                'customers' => [
                    'total' => $customersTotal,
                    'new_last_7_days' => $customersNewLast7Days,
                ],
                'loyalty_programs' => [
                    'total' => $programsTotal,
                    'active' => $programsActive,
                ],
                'stamps_awarded' => [
                    'total' => $stampsTotal,
                    'last_7_days' => $stampsLast7Days,
                ],
                'vouchers' => [
                    'issued_total' => $vouchersIssuedTotal,
                    'issued_last_7_days' => $vouchersIssuedLast7Days,
                    'redeemed_total' => $vouchersRedeemedTotal,
                    'redeemed_last_7_days' => $vouchersRedeemedLast7Days,
                ],
            ],
            'message' => 'Platform stats retrieved successfully.',
        ], 200);
    }
}
