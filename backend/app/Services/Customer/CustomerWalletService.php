<?php

namespace App\Services\Customer;

use App\Models\StampCard;
use App\Models\StampTransaction;
use App\Models\UserMerchantStat;
use App\Models\Visit;
use Carbon\Carbon;

class CustomerWalletService
{
    /**
     * Retrieve all active stamp cards for the customer with summary statistics.
     */
    public function getWallet(int $customerId): array
    {
        $cards = StampCard::query()
            ->where('customer_id', $customerId)
            ->where('status', 'active')
            ->with([
                'loyaltyProgram.merchant',
                'programVersion.earningRule',
                'programVersion.reward',
            ])
            ->orderByDesc('updated_at')
            ->get();

        $merchantIds = $cards->pluck('loyaltyProgram.merchant_id')->filter()->unique();

        // Eager load streak stats in a single query to eliminate N+1
        $stats = UserMerchantStat::query()
            ->where('customer_id', $customerId)
            ->whereIn('merchant_id', $merchantIds)
            ->get()
            ->keyBy('merchant_id');

        $formattedCards = $cards->map(function (StampCard $card) use ($stats) {
            $merchant = $card->loyaltyProgram?->merchant;
            $stat = $merchant ? $stats->get($merchant->id) : null;
            return $this->formatCard($card, $stat);
        });

        $summary = [
            'active_cards_count' => $cards->count(),
            'businesses_joined_count' => $merchantIds->count(),
            'highest_current_streak' => (int) ($stats->max('current_streak') ?? 0),
        ];

        return [
            'cards' => $formattedCards,
            'summary' => $summary,
        ];
    }

    /**
     * Retrieve single stamp card details (active or completed) including visit history.
     * Returns null if card does not exist or belongs to another customer.
     */
    public function getCardDetail(int $cardId, int $customerId): ?array
    {
        $card = StampCard::query()
            ->where('id', $cardId)
            ->where('customer_id', $customerId)
            ->with([
                'loyaltyProgram.merchant',
                'programVersion.earningRule',
                'programVersion.reward',
            ])
            ->first();

        if (!$card) {
            return null;
        }

        $merchant = $card->loyaltyProgram?->merchant;
        $tz = $merchant?->timezone ?: 'Asia/Kathmandu';

        $stat = $merchant ? UserMerchantStat::query()
            ->where('customer_id', $customerId)
            ->where('merchant_id', $merchant->id)
            ->first() : null;

        // Query the 30 most recent visits for this customer at this business
        $visits = $merchant ? Visit::query()
            ->where('customer_id', $customerId)
            ->where('merchant_id', $merchant->id)
            ->orderByDesc('scanned_at')
            ->limit(30)
            ->get() : collect();

        // Look up stamps awarded from stamp_transactions for these visits
        $visitIds = $visits->pluck('id');
        $stampsMap = StampTransaction::query()
            ->where('source_type', 'visit')
            ->whereIn('source_id', $visitIds)
            ->pluck('stamps_awarded', 'source_id');

        $formattedVisits = $visits->map(function (Visit $visit) use ($tz, $stampsMap) {
            $scannedAt = $visit->scanned_at ? Carbon::parse($visit->scanned_at)->setTimezone($tz) : null;
            $localDate = $visit->local_date ? Carbon::parse($visit->local_date, $tz) : null;

            $stampsAwarded = $stampsMap->get($visit->id);

            return [
                'id' => $visit->id,
                'date' => $scannedAt ? $scannedAt->format('Y-m-d') : $localDate?->format('Y-m-d'),
                'time' => $scannedAt ? $scannedAt->format('H:i:s') : null,
                'datetime' => $scannedAt ? $scannedAt->toIso8601String() : null,
                'timezone' => $tz,
                'result' => $visit->status,
                'status' => $visit->status,
                'rejection_reason' => $visit->rejection_reason,
                'stamps_awarded' => $stampsAwarded !== null ? (int) $stampsAwarded : null,
            ];
        });

        $baseCard = $this->formatCard($card, $stat);

        // Include full reward snapshot and visit history
        $reward = $card->programVersion?->reward;
        $baseCard['reward'] = $reward ? [
            'title' => $reward->title,
            'description' => $reward->description,
            'reward_type' => $reward->reward_type,
            'reward_value' => $reward->reward_value !== null ? (float) $reward->reward_value : null,
            'voucher_validity_days' => (int) $reward->voucher_validity_days,
        ] : null;

        $baseCard['visit_history'] = $formattedVisits;

        return $baseCard;
    }

    /**
     * Format a stamp card with version snapshots, business status, and streak stats.
     */
    public function formatCard(StampCard $card, ?UserMerchantStat $stat): array
    {
        $program = $card->loyaltyProgram;
        $merchant = $program?->merchant;
        $version = $card->programVersion;
        $earningRule = $version?->earningRule;
        $reward = $version?->reward;

        $tz = $merchant?->timezone ?: 'Asia/Kathmandu';
        $lastVisitDate = $stat?->last_qualifying_visit_date
            ? Carbon::parse($stat->last_qualifying_visit_date)->format('Y-m-d')
            : null;

        $streakActive = $this->isStreakActive($lastVisitDate, $tz);

        $earningMethod = $earningRule?->earning_type;
        $isVisit = $earningMethod === 'visit';

        return [
            'id' => $card->id,
            'status' => $card->status,
            'stamps_earned' => (int) $card->stamps_earned,
            'stamps_required' => $isVisit && $earningRule?->threshold !== null
                ? (int) $earningRule->threshold
                : null,
            'threshold' => $earningRule?->threshold !== null
                ? (float) $earningRule->threshold
                : null,
            'earning_method' => $earningMethod,
            'program' => [
                'id' => $program?->id,
                'name' => $program?->name,
            ],
            'business' => [
                'id' => $merchant?->id,
                'name' => $merchant?->business_name,
                'slug' => $merchant?->slug,
                'logo' => $merchant?->logo,
                'status' => $merchant?->status, // "active" or "suspended"
            ],
            'reward' => $reward ? [
                'title' => $reward->title,
                'description' => $reward->description,
            ] : null,
            'reward_title' => $reward?->title,
            'reward_description' => $reward?->description,
            'streak' => [
                'current_streak' => (int) ($stat?->current_streak ?? 0),
                'longest_streak' => (int) ($stat?->longest_streak ?? 0),
                'last_visit_date' => $lastVisitDate,
                'streak_active' => $streakActive,
            ],
            'current_streak' => (int) ($stat?->current_streak ?? 0),
            'longest_streak' => (int) ($stat?->longest_streak ?? 0),
            'last_visit_date' => $lastVisitDate,
            'streak_active' => $streakActive,
        ];
    }

    /**
     * Determine if a streak is currently active (read-only calculation).
     * Active only if last_qualifying_visit_date is today or yesterday in the merchant's timezone.
     */
    public function isStreakActive(?string $lastVisitDate, ?string $timezone): bool
    {
        if (!$lastVisitDate) {
            return false;
        }

        $tz = $timezone ?: 'Asia/Kathmandu';
        $todayInTz = Carbon::now($tz)->startOfDay();
        $yesterdayInTz = Carbon::now($tz)->subDay()->startOfDay();

        $visitDate = Carbon::parse($lastVisitDate, $tz)->startOfDay();

        return $visitDate->equalTo($todayInTz) || $visitDate->equalTo($yesterdayInTz);
    }
}
