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
            ])->lockForUpdate()->findOrFail($validated['stamp_card_id']);

            if ((int) $card->loyaltyProgram->merchant_id !== (int) $merchant->id) {
                return response()->json([
                    'message' => 'This customer does not belong to your loyalty program.',
                ], 403);
            }

            if ($card->status !== 'active') {
                return response()->json([
                    'message' => 'This stamp card is not active.',
                ], 422);
            }

            // Prevent duplicate requests.
            $existingTransaction = StampTransaction::where(
                'idempotency_key',
                $validated['idempotency_key']
            )->first();

            if ($existingTransaction) {
                return response()->json([
                    'message' => 'This stamp award has already been processed.',
                    'transaction' => $existingTransaction,
                ], 200);
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

            $requiredQuantity = null;
            $newTotalQuantity = null;
            $vouchersToIssue = 0;

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

                $quantity = $validated['quantity'];
                $requiredQuantity = (int) $selectedProductRule->quantity_required;

                if ($requiredQuantity < 1) {
                    return response()->json([
                        'message' => 'Invalid quantity requirement for this product.',
                    ], 422);
                }

                // Check the optional program-wide daily stamp limit.
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

                // Calculate this product's existing progress today.
                $previousQuantity = StampTransaction::where('stamp_card_id', $card->id)
                    ->where('program_version_id', $card->program_version_id)
                    ->where('earning_rule_product_id', $selectedProductRule->id)
                    ->whereBetween('created_at', [$todayStart, $todayEnd])
                    ->sum('stamps_awarded');

                $newTotalQuantity = (int) $previousQuantity + $quantity;

                // Calculate how many new rewards have been earned.
                $previousRewards = intdiv(
                    (int) $previousQuantity,
                    $requiredQuantity
                );

                $newRewards = intdiv(
                    $newTotalQuantity,
                    $requiredQuantity
                );

                $vouchersToIssue = $newRewards - $previousRewards;

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
            | Issue quantity-based vouchers
            |--------------------------------------------------------------------------
            */

            if (
                $earningRule->earning_type === 'quantity'
                && $vouchersToIssue > 0
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
                'quantity_progress' => $earningRule->earning_type === 'quantity'
                    ? [
                        'product_id' => $validated['product_id'],
                        'quantity_awarded' => $stampsToAward,
                        'quantity_required' => $requiredQuantity,
                        'today_quantity' => $newTotalQuantity,
                        'remaining_quantity' => $remainingQuantity,
                    ]
                    : null,
                'vouchers_issued' => count($vouchersIssued),
                'vouchers' => $vouchersIssued,
                'transaction' => $transaction,
            ], 201);
        });
    }

    /**
     * Generate a unique voucher code.
     */
    private function generateVoucherCode(): string
    {
        do {
            $code = Str::upper(Str::random(12));
        } while (Voucher::where('code', $code)->exists());

        return $code;
    }
}
