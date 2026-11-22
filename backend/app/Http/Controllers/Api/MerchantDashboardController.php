<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

class MerchantDashboardController extends Controller
{
   public function me(Request $request)
{
    $user = $request->user();

    if ($user->role !== 'merchant') {
        return response()->json([
            'success' => false,
            'message' => 'Unauthorized access.',
        ], 403);
    }

    $merchant = $user->merchant;

    if (!$merchant || $merchant->status !== 'active') {
        return response()->json([
            'success' => false,
            'message' => 'Merchant account is not active.',
        ], 403);
    }

    return response()->json([
        'success' => true,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
        ],
        'merchant' => [
            'id' => $merchant->id,
            'business_name' => $merchant->business_name,
            'slug' => $merchant->slug,
            'phone' => $merchant->phone,
            'address' => $merchant->address,
        ],
    ]);
}

    public function updateMe(Request $request)
    {
        $user = $request->user();

        if ($user->role !== 'merchant') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access.',
            ], 403);
        }

        $merchant = $user->merchant;

        if (!$merchant || $merchant->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Merchant account is not active.',
            ], 403);
        }

        $validated = $request->validate([
            // Business Information
            'business_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'address' => ['sometimes', 'nullable', 'string'],

            // Personal Account
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'personal_phone' => ['sometimes', 'nullable', 'string', 'max:20'],

            // Password & Security
            'current_password' => ['required_with:password', 'string', 'current_password:web'],
            'password' => ['sometimes', 'required', 'string', 'min:8', 'confirmed'],
        ]);

        // Update user fields
        $userUpdates = [];
        if (isset($validated['name'])) {
            $userUpdates['name'] = $validated['name'];
        }
        if (isset($validated['email'])) {
            $userUpdates['email'] = $validated['email'];
        }
        if (array_key_exists('personal_phone', $validated)) {
            $userUpdates['phone'] = $validated['personal_phone'];
        }
        if (isset($validated['password'])) {
            $userUpdates['password'] = Hash::make($validated['password']);
        }
        if (!empty($userUpdates)) {
            $user->update($userUpdates);
        }

        // Update merchant fields
        $merchantUpdates = [];
        if (isset($validated['business_name'])) {
            $merchantUpdates['business_name'] = $validated['business_name'];
        }
        if (array_key_exists('phone', $validated)) {
            $merchantUpdates['phone'] = $validated['phone'];
        }
        if (array_key_exists('address', $validated)) {
            $merchantUpdates['address'] = $validated['address'];
        }
        if (!empty($merchantUpdates)) {
            $merchant->update($merchantUpdates);
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
            ],
            'merchant' => [
                'id' => $merchant->id,
                'business_name' => $merchant->business_name,
                'slug' => $merchant->slug,
                'phone' => $merchant->phone,
                'address' => $merchant->address,
            ],
        ]);
    }
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
