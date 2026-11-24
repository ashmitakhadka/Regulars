<?php

namespace App\Services\Customer;

use App\Models\LoyaltyProgram;
use App\Models\StampCard;
use App\Models\UserMerchantStat;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;

class CustomerJoinService
{
    /**
     * Join a single loyalty program for the given customer.
     *
     * Returns:
     * - null if the program is unknown, inactive, or belongs to an inactive/suspended merchant.
     * - array with ['already_joined' => true, 'card' => StampCard] if customer already has an active card.
     * - array with ['already_joined' => false, 'card' => StampCard] if a new card was created.
     */
    public function joinProgram(int $customerId, int $programId): ?array
    {
        // 1. Verify that program is active and merchant business is active
        $program = LoyaltyProgram::query()
            ->with('merchant')
            ->where('id', $programId)
            ->where('status', 'active')
            ->first();

        if (!$program || !$program->merchant || $program->merchant->status !== 'active') {
            return null;
        }

        $merchant = $program->merchant;

        // 2. Execute within an atomic transaction with serialized locking on customer-merchant stats
        return DB::transaction(function () use ($customerId, $program, $merchant) {
            // First firstOrCreate the user_merchant_stats row for this customer and business
            // (zero values only, never modify an existing row; handle race conditions on duplicate key).
            try {
                $stat = UserMerchantStat::firstOrCreate(
                    [
                        'customer_id' => $customerId,
                        'merchant_id' => $merchant->id,
                    ],
                    [
                        'current_streak' => 0,
                        'longest_streak' => 0,
                        'last_qualifying_visit_date' => null,
                    ]
                );
            } catch (QueryException $e) {
                // If another concurrent request inserted the stats row at the exact same instant
                $stat = UserMerchantStat::where('customer_id', $customerId)
                    ->where('merchant_id', $merchant->id)
                    ->firstOrFail();
            }

            // Lock that stats row with lockForUpdate to serialize any simultaneous joins
            UserMerchantStat::where('id', $stat->id)
                ->lockForUpdate()
                ->first();

            // Check for an existing active card for this customer and program
            $existingCard = StampCard::query()
                ->where('customer_id', $customerId)
                ->where('loyalty_program_id', $program->id)
                ->where('status', 'active')
                ->with(['loyaltyProgram.merchant'])
                ->first();

            if ($existingCard) {
                return [
                    'already_joined' => true,
                    'card' => $existingCard,
                ];
            }

            // Version selection: use exact same rule as MerchantCustomerController::enrollCustomer
            // (status active, effective_at null or not in future, highest version_number)
            $programVersion = $program->versions()
                ->where('status', 'active')
                ->where(function ($query) {
                    $query->whereNull('effective_at')
                        ->orWhere('effective_at', '<=', now());
                })
                ->orderByDesc('version_number')
                ->first();

            if (!$programVersion) {
                return null;
            }

            // Create stamp card with stamps_earned: 0, status: active, started_at: now()
            $stampCard = StampCard::create([
                'customer_id' => $customerId,
                'loyalty_program_id' => $program->id,
                'program_version_id' => $programVersion->id,
                'stamps_earned' => 0,
                'status' => 'active',
                'started_at' => now(),
            ]);

            $stampCard->load(['loyaltyProgram.merchant']);

            return [
                'already_joined' => false,
                'card' => $stampCard,
            ];
        });
    }

    /**
     * Join multiple loyalty programs in bulk.
     * Each program is handled in its own transaction so one unavailable program
     * does not affect others. Results keep the order of program_ids sent.
     */
    public function joinMultiplePrograms(int $customerId, array $programIds): array
    {
        $results = [];

        foreach ($programIds as $programId) {
            $id = (int) $programId;
            $outcome = $this->joinProgram($customerId, $id);

            if ($outcome === null) {
                $results[] = [
                    'program_id' => $id,
                    'status' => 'unavailable',
                    'card_id' => null,
                    'message' => 'Program is unavailable or not found.',
                ];
            } elseif ($outcome['already_joined']) {
                $card = $outcome['card'];
                $results[] = [
                    'program_id' => $id,
                    'status' => 'already_joined',
                    'card_id' => $card->id,
                    'program_name' => $card->loyaltyProgram?->name,
                    'business_name' => $card->loyaltyProgram?->merchant?->business_name,
                ];
            } else {
                $card = $outcome['card'];
                $results[] = [
                    'program_id' => $id,
                    'status' => 'joined',
                    'card_id' => $card->id,
                    'program_name' => $card->loyaltyProgram?->name,
                    'business_name' => $card->loyaltyProgram?->merchant?->business_name,
                ];
            }
        }

        return $results;
    }
}
