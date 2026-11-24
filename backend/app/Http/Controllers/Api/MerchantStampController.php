<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StampCard;
use App\Models\StampTransaction;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MerchantStampController extends Controller
{
    public function awardStamp(Request $request)
    {
        $validated = $request->validate([
            'stamp_card_id' => ['required', 'integer', 'exists:stamp_cards,id'],
            'idempotency_key' => ['required', 'uuid'],
            'purchase_amount' => ['nullable', 'numeric', 'min:0'],
            'product_id' => ['nullable', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:10000'],
        ]);

        $user = $request->user();

        if (!$user || $user->role !== 'merchant') {
            return response()->json([
                'message' => 'Unauthorized merchant.',
            ], 403);
        }

        $merchant = $user->merchant()->first();

        if (!$merchant || $merchant->status !== 'active') {
            return response()->json([
                'message' => 'Merchant account is not active.',
            ], 403);
        }

        return DB::transaction(function () use ($validated, $merchant, $user) {

            $card = StampCard::with([
                'loyaltyProgram',
                'programVersion',
                'programVersion.earningRule',
                'programVersion.reward',
            ])->lockForUpdate()->findOrFail($validated['stamp_card_id']);

            if ((int) $card->loyaltyProgram->merchant_id !== (int) $merchant->id) {
                return response()->json([
                    'message' => 'This customer does not belong to your loyalty program.',
                ], 403);
            }

            // Prevent duplicate requests.
            $existingTransaction = StampTransaction::where(
                'idempotency_key',
                $validated['idempotency_key']
            )->first();

            if ($existingTransaction) {
                $existingVouchers = Voucher::where('stamp_transaction_id', $existingTransaction->id)->get();

                return response()->json([
                    'message' => 'This stamp award has already been processed.',
                    'transaction' => $existingTransaction,
                    'vouchers' => $existingVouchers,
                    'vouchers_issued' => $existingVouchers->count(),
                ], 200);
            }

            if ($card->status !== 'active') {
                return response()->json([
                    'message' => 'This stamp card is not active.',
                ], 422);
            }

            $earningRule = $card->programVersion->earningRule;

            if (!$earningRule) {
                return response()->json([
                    'message' => 'No earning rule is configured for this program.',
                ], 422);
            }

            $timezone = $merchant->timezone ?? 'Asia/Kathmandu';

            $todayStart = now($timezone)->startOfDay()->utc();
            $todayEnd = now($timezone)->endOfDay()->utc();

            $stampsToAward = 0;
            $selectedTier = null;
            $selectedProductRule = null;
            $vouchersIssued = [];
            $isRewardCompleted = false;
            $rewardsCompleted = 0;

            $requiredQuantity = null;
            $newTotalQuantity = null;
            $todayQuantity = null;
            $vouchersToIssue = 0;
            $reward = null;

            /*
            |--------------------------------------------------------------------------
            | Visit-based earning
            |--------------------------------------------------------------------------
            */

            if ($earningRule->earning_type === 'visit') {

                $stampsToAward = $earningRule->stamps_awarded;

                if ($earningRule->daily_stamp_limit !== null) {

                    $todayStamps = StampTransaction::where('stamp_card_id', $card->id)
                        ->where('program_version_id', $card->program_version_id)
                        ->whereBetween('created_at', [$todayStart, $todayEnd])
                        ->sum('stamps_awarded');

                    if ($todayStamps + $stampsToAward > $earningRule->daily_stamp_limit) {
                        return response()->json([
                            'message' => 'The customer has reached the daily stamp limit.',
                        ], 422);
                    }
                }

                $reward = $card->programVersion->reward;

                // Count existing qualifying visits (each recorded merchant_award transaction = 1 visit)
                $qualifyingVisits = StampTransaction::where('stamp_card_id', $card->id)
                    ->where('program_version_id', $card->program_version_id)
                    ->where('source_type', 'merchant_award')
                    ->count() + 1; // including the visit being awarded now

                $requiredVisits = (int) $earningRule->threshold;
                if ($requiredVisits > 0 && $qualifyingVisits >= $requiredVisits) {
                    $isRewardCompleted = true;
                    $rewardsCompleted = 1;
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Purchase-based earning
            |--------------------------------------------------------------------------
            */

            elseif ($earningRule->earning_type === 'purchase') {

                if (!isset($validated['purchase_amount'])) {
                    return response()->json([
                        'message' => 'Purchase amount is required.',
                    ], 422);
                }

                $purchaseAmount = $validated['purchase_amount'];

                $tiers = $earningRule->tiers()
                    ->orderByDesc('min_amount')
                    ->get();

                if ($tiers->isNotEmpty()) {

                    $selectedTier = $tiers->first(function ($tier) use ($purchaseAmount) {
                        return $purchaseAmount >= $tier->min_amount
                            && (
                                $tier->max_amount === null
                                || $purchaseAmount <= $tier->max_amount
                            );
                    });

                    if (!$selectedTier) {
                        return response()->json([
                            'message' => 'Purchase amount does not qualify for any stamp tier.',
                        ], 422);
                    }

                    $alreadyAwarded = StampTransaction::where('stamp_card_id', $card->id)
                        ->where('earning_rule_tier_id', $selectedTier->id)
                        ->whereBetween('created_at', [$todayStart, $todayEnd])
                        ->exists();

                    if ($alreadyAwarded) {
                        return response()->json([
                            'message' => 'Stamps have already been awarded for this purchase tier today.',
                        ], 422);
                    }

                    $stampsToAward = $selectedTier->stamps_awarded;

                } else {

                    if (
                        $earningRule->threshold === null
                        || $purchaseAmount < $earningRule->threshold
                    ) {
                        return response()->json([
                            'message' => 'Purchase amount does not meet the minimum spending requirement.',
                        ], 422);
                    }

                    $stampsToAward = $earningRule->stamps_awarded;

                    if ($earningRule->daily_stamp_limit !== null) {

                        $todayStamps = StampTransaction::where('stamp_card_id', $card->id)
                            ->where('program_version_id', $card->program_version_id)
                            ->whereBetween('created_at', [$todayStart, $todayEnd])
                            ->sum('stamps_awarded');

                        if ($todayStamps + $stampsToAward > $earningRule->daily_stamp_limit) {
                            return response()->json([
                                'message' => 'The customer has reached the daily stamp limit.',
                            ], 422);
                        }
                    }
                }

                $reward = $card->programVersion->reward;
                $stampsRequired = (int) ($reward?->stamps_required ?? $earningRule->threshold ?? 1);

                if ($stampsRequired > 0 && ($card->stamps_earned + $stampsToAward) >= $stampsRequired) {
                    $isRewardCompleted = true;
                    $rewardsCompleted = 1;
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Quantity-based earning
            |--------------------------------------------------------------------------
            */

            elseif ($earningRule->earning_type === 'quantity') {

                if (!isset($validated['product_id'], $validated['quantity'])) {
                    return response()->json([
                        'message' => 'Product ID and quantity are required.',
                    ], 422);
                }

                // Find the product-specific earning configuration.
                $selectedProductRule = $earningRule->productRules()
                    ->with(['product', 'reward'])
                    ->where('product_id', $validated['product_id'])
                    ->first();

                if (!$selectedProductRule) {
                    return response()->json([
                        'message' => 'This product is not configured for this loyalty program.',
                    ], 422);
                }

                $product = $selectedProductRule->product;

                // Verify merchant ownership and product status.
                if (
                    !$product
                    || (int) $product->merchant_id !== (int) $merchant->id
                    || $product->status !== 'active'
                ) {
                    return response()->json([
                        'message' => 'This product is not available for your merchant account.',
                    ], 403);
                }

                $reward = $selectedProductRule->reward;

                if (!$reward) {
                    return response()->json([
                        'message' => 'No reward is configured for this product.',
                    ], 422);
                }

                $quantity = (int) $validated['quantity'];
                $requiredQuantity = (int) $selectedProductRule->quantity_required;

                if ($requiredQuantity < 1) {
                    return response()->json([
                        'message' => 'Invalid quantity requirement for this product.',
                    ], 422);
                }

                // Check the program-wide daily stamp limit per local day
                if ($earningRule->daily_stamp_limit !== null) {

                    $todayStamps = StampTransaction::where('stamp_card_id', $card->id)
                        ->where('program_version_id', $card->program_version_id)
                        ->whereBetween('created_at', [$todayStart, $todayEnd])
                        ->sum('stamps_awarded');

                    if ($todayStamps + $quantity > $earningRule->daily_stamp_limit) {
                        return response()->json([
                            'message' => 'The customer has reached the daily stamp limit.',
                        ], 422);
                    }
                }

                // Cumulative progress across all days for this product rule & version
                $previousCumulativeQuantity = StampTransaction::where('stamp_card_id', $card->id)
                    ->where('program_version_id', $card->program_version_id)
                    ->where('earning_rule_product_id', $selectedProductRule->id)
                    ->sum('stamps_awarded');

                $newTotalQuantity = (int) $previousCumulativeQuantity + $quantity;

                // Today's progress for this product rule
                $todayPrevious = StampTransaction::where('stamp_card_id', $card->id)
                    ->where('program_version_id', $card->program_version_id)
                    ->where('earning_rule_product_id', $selectedProductRule->id)
                    ->whereBetween('created_at', [$todayStart, $todayEnd])
                    ->sum('stamps_awarded');
                $todayQuantity = (int) $todayPrevious + $quantity;

                // Calculate rewards earned historically across all days
                $totalRewardsEarned = intdiv($newTotalQuantity, $requiredQuantity);
                $previousRewardsEarned = intdiv((int) $previousCumulativeQuantity, $requiredQuantity);
                $rewardsCompleted = max(0, $totalRewardsEarned - $previousRewardsEarned);

                if ($rewardsCompleted > 0) {
                    $isRewardCompleted = true;
                }

                // Strict deduplication per reward completion:
                // Count vouchers already issued for this exact card and reward
                $alreadyIssuedVouchersCount = Voucher::where('stamp_card_id', $card->id)
                    ->where('reward_id', $reward->id)
                    ->count();

                // Number of vouchers to issue is strictly the difference between total rewards earned and already issued
                $vouchersToIssue = max(0, $totalRewardsEarned - $alreadyIssuedVouchersCount);

                $stampsToAward = $quantity;
            }

            else {
                return response()->json([
                    'message' => 'This earning type is not supported.',
                ], 422);
            }

            /*
            |--------------------------------------------------------------------------
            | Record stamp transaction
            |--------------------------------------------------------------------------
            */

            $transaction = StampTransaction::create([
                'stamp_card_id' => $card->id,
                'program_version_id' => $card->program_version_id,
                'earning_rule_tier_id' => $selectedTier?->id,
                'earning_rule_product_id' => $selectedProductRule?->id,
                'source_type' => 'merchant_award',
                'source_id' => 0,
                'stamps_awarded' => $stampsToAward,
                'awarded_by_user_id' => $user->id,
                'idempotency_key' => $validated['idempotency_key'],
            ]);

            // Use the transaction's own ID as its source ID.
            $transaction->update([
                'source_id' => $transaction->id,
            ]);

            // Update the customer's total stamp count.
            $card->increment('stamps_earned', $stampsToAward);

            $card->refresh();

            /*
            |--------------------------------------------------------------------------
            | Stamp Card Completion (Visit and Purchase)
            |--------------------------------------------------------------------------
            */

            if (in_array($earningRule->earning_type, ['visit', 'purchase']) && $isRewardCompleted) {
                $card->update([
                    'status' => 'completed',
                    'completed_at' => now($timezone)->utc(),
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Issue Vouchers when issues_voucher = true
            |--------------------------------------------------------------------------
            */

            $issuesVoucher = (bool) ($card->programVersion->issues_voucher ?? true);

            // 1. Visit and Purchase Voucher Issuance
            if (
                in_array($earningRule->earning_type, ['visit', 'purchase'])
                && $isRewardCompleted
                && $issuesVoucher
                && $reward
            ) {
                // Ensure no voucher has already been issued for this card and reward
                $alreadyHasVoucher = Voucher::where('stamp_card_id', $card->id)
                    ->where('reward_id', $reward->id)
                    ->exists();

                if (!$alreadyHasVoucher) {
                    $issuedAt = now($timezone)->utc();
                    $expiresAt = $issuedAt->copy()->addDays(
                        $reward->voucher_validity_days ?? 30
                    );

                    $voucher = Voucher::create([
                        'merchant_id' => $merchant->id,
                        'customer_id' => $card->customer_id,
                        'stamp_card_id' => $card->id,
                        'reward_id' => $reward->id,
                        'stamp_transaction_id' => $transaction->id,
                        'code' => $this->generateVoucherCode(),
                        'source_type' => $earningRule->earning_type . '_reward',
                        'reward_title' => $reward->title,
                        'reward_description' => $reward->description,
                        'reward_type' => $reward->reward_type,
                        'reward_value' => $reward->reward_value,
                        'currency' => $merchant->currency ?? 'NPR',
                        'status' => 'active',
                        'issued_at' => $issuedAt,
                        'expires_at' => $expiresAt,
                    ]);

                    $vouchersIssued[] = $voucher;
                }
            }

            // 2. Quantity-based Voucher Issuance (per reward completion deduplicated)
            elseif (
                $earningRule->earning_type === 'quantity'
                && $vouchersToIssue > 0
                && $issuesVoucher
                && $reward
            ) {
                $issuedAt = now($timezone)->utc();
                $expiresAt = $issuedAt->copy()->addDays(
                    $reward->voucher_validity_days ?? 30
                );

                for ($i = 0; $i < $vouchersToIssue; $i++) {
                    $voucher = Voucher::create([
                        'merchant_id' => $merchant->id,
                        'customer_id' => $card->customer_id,
                        'stamp_card_id' => $card->id,
                        'reward_id' => $reward->id,
                        'stamp_transaction_id' => $transaction->id,
                        'code' => $this->generateVoucherCode(),
                        'source_type' => 'quantity_reward',
                        'reward_title' => $reward->title,
                        'reward_description' => $reward->description,
                        'reward_type' => $reward->reward_type,
                        'reward_value' => $reward->reward_value,
                        'currency' => $merchant->currency ?? 'NPR',
                        'status' => 'active',
                        'issued_at' => $issuedAt,
                        'expires_at' => $expiresAt,
                    ]);

                    $vouchersIssued[] = $voucher;
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Calculate quantity progress
            |--------------------------------------------------------------------------
            */

            $remainingQuantity = null;

            if ($earningRule->earning_type === 'quantity') {
                $remainder = $newTotalQuantity % $requiredQuantity;

                $remainingQuantity = $remainder === 0
                    ? 0
                    : $requiredQuantity - $remainder;
            }

            /*
            |--------------------------------------------------------------------------
            | Response
            |--------------------------------------------------------------------------
            */

            return response()->json([
                'message' => 'Stamps awarded successfully.',
                'earning_type' => $earningRule->earning_type,
                'stamps_awarded' => $stampsToAward,
                'total_stamps' => $card->stamps_earned,
                'card_status' => $card->status,
                'reward_completed' => $isRewardCompleted,
                'rewards_completed' => $rewardsCompleted,
                'quantity_progress' => $earningRule->earning_type === 'quantity'
                    ? [
                        'product_id' => $validated['product_id'],
                        'quantity_awarded' => $stampsToAward,
                        'quantity_required' => $requiredQuantity,
                        'cumulative_quantity' => $newTotalQuantity,
                        'today_quantity' => $todayQuantity,
                        'remaining_quantity' => $remainingQuantity,
                        'rewards_completed' => $rewardsCompleted,
                    ]
                    : null,
                'vouchers_issued' => count($vouchersIssued),
                'vouchers' => $vouchersIssued,
                'transaction' => $transaction,
            ], 201);
        });
    }

    /**
 * Generate a unique 8-character voucher code.
 */
private function generateVoucherCode(): string
{
    $characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    do {
        $code = '';

        for ($i = 0; $i < 8; $i++) {
            $code .= $characters[random_int(0, strlen($characters) - 1)];
        }

    } while (Voucher::where('code', $code)->exists());

    return $code;
}
}
