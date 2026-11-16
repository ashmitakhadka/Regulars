<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;

class MerchantDashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        // Verify merchant role
        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        // Get authenticated merchant
        $merchant = $user->merchant;

        if (!$merchant || $merchant->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Merchant account is not active.',
            ], 403);
        }

        // 1. Total unique customers
        $totalCustomers = DB::table('stamp_cards')
            ->join(
                'loyalty_programs',
                'stamp_cards.loyalty_program_id',
                '=',
                'loyalty_programs.id'
            )
            ->where('loyalty_programs.merchant_id', $merchant->id)
            ->distinct()
            ->count('stamp_cards.customer_id');

        // 2. Total stamps collected
        $stampsCollected = DB::table('stamp_transactions')
            ->join(
                'stamp_cards',
                'stamp_transactions.stamp_card_id',
                '=',
                'stamp_cards.id'
            )
            ->join(
                'loyalty_programs',
                'stamp_cards.loyalty_program_id',
                '=',
                'loyalty_programs.id'
            )
            ->where('loyalty_programs.merchant_id', $merchant->id)
            ->sum('stamp_transactions.stamps_awarded');

        // 3. Total vouchers generated
        $vouchersGenerated = $merchant->vouchers()->count();

        // 4. Active streaks
        $today = now($merchant->timezone)->toDateString();

        $yesterday = Carbon::parse(
            $today,
            $merchant->timezone
        )->subDay()->toDateString();

        $activeStreaks = $merchant->customerStats()
            ->where('current_streak', '>', 0)
            ->whereBetween(
                'last_qualifying_visit_date',
                [$yesterday, $today]
            )
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total_customers' => $totalCustomers,
                'stamps_collected' => $stampsCollected,
                'vouchers_generated' => $vouchersGenerated,
                'active_streaks' => $activeStreaks,
            ],
        ]);
    }
}
