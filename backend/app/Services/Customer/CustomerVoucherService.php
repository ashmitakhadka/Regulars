<?php

namespace App\Services\Customer;

use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class CustomerVoucherService
{
    /**
     * Maps raw database source_type into clean public source name:
     * stamp_card, offer, promo, or other.
     */
    public static function mapSource(?string $sourceType): string
    {
        return match ($sourceType) {
            'stamp_card', 'visit_reward', 'purchase_reward', 'quantity_reward' => 'stamp_card',
            'offer', 'targeted_offer' => 'offer',
            'promo', 'promo_code' => 'promo',
            default => 'other',
        };
    }

    /**
     * Determines effective status dynamically without modifying the database.
     * An active voucher whose expiry has passed is evaluated as 'expired'.
     * A voucher that has been redeemed is evaluated as 'used'.
     */
    public static function getEffectiveStatus(Voucher $voucher, ?string $timezone = null): string
    {
        if ($voucher->status === 'redeemed' || $voucher->redeemed_at !== null) {
            return 'used';
        }

        if ($voucher->status === 'expired') {
            return 'expired';
        }

        if ($voucher->expires_at) {
            $tz = $timezone ?: ($voucher->merchant?->timezone ?: 'Asia/Kathmandu');
            $nowInTz = Carbon::now($tz);
            $expiresAtInTz = $voucher->expires_at->copy()->setTimezone($tz);

            if ($nowInTz->gt($expiresAtInTz)) {
                return 'expired';
            }
        }

        return 'active';
    }

    /**
     * Calculates whole calendar days between today and expiry date in the business timezone.
     * 0 means it expires today. Returns null if not active.
     */
    public static function calculateDaysLeft(Voucher $voucher, string $effectiveStatus, ?string $timezone = null): ?int
    {
        if ($effectiveStatus !== 'active' || !$voucher->expires_at) {
            return null;
        }

        $tz = $timezone ?: ($voucher->merchant?->timezone ?: 'Asia/Kathmandu');
        $todayInTz = Carbon::now($tz)->startOfDay();
        $expiryDayInTz = $voucher->expires_at->copy()->setTimezone($tz)->startOfDay();

        $diff = (int) $todayInTz->diffInDays($expiryDayInTz, false);

        return max(0, $diff);
    }

    /**
     * Determines if an active voucher is expiring within 3 days.
     */
    public static function isExpiringSoon(?int $daysLeft, string $effectiveStatus): bool
    {
        return $effectiveStatus === 'active' && $daysLeft !== null && $daysLeft <= 3;
    }

    /**
     * Lists paginated vouchers for a customer with optional status filtering and summary counts.
     */
    public function listCustomerVouchers(int $customerId, array $filters = []): array
    {
        $statusFilter = $filters['status'] ?? null;
        $page = isset($filters['page']) ? max(1, (int) $filters['page']) : 1;
        $perPage = isset($filters['per_page']) ? max(1, min(50, (int) $filters['per_page'])) : 20;

        $nowUtc = Carbon::now('UTC')->toDateTimeString();

        $query = Voucher::query()
            ->where('customer_id', $customerId)
            ->with(['merchant']);

        // Apply effective status filtering
        if ($statusFilter === 'active') {
            $query->where('status', 'active')
                ->whereNull('redeemed_at')
                ->where(function ($q) use ($nowUtc) {
                    $q->whereNull('expires_at')->orWhere('expires_at', '>', $nowUtc);
                });
        } elseif ($statusFilter === 'used') {
            $query->where(function ($q) {
                $q->where('status', 'redeemed')->orWhereNotNull('redeemed_at');
            });
        } elseif ($statusFilter === 'expired') {
            $query->where(function ($q) use ($nowUtc) {
                $q->where('status', 'expired')
                    ->orWhere(function ($q2) use ($nowUtc) {
                        $q2->where('status', 'active')
                            ->whereNull('redeemed_at')
                            ->where('expires_at', '<=', $nowUtc);
                    });
            });
        }

        /** @var LengthAwarePaginator $paginator */
        $paginator = $query->orderByDesc('issued_at')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'page', $page);

        // Compute summary counts across ALL customer vouchers using one conditional query
        $summaryData = Voucher::query()
            ->where('customer_id', $customerId)
            ->selectRaw("
                COALESCE(SUM(CASE WHEN (status = 'active' AND redeemed_at IS NULL AND (expires_at IS NULL OR expires_at > ?)) THEN 1 ELSE 0 END), 0) as active_count,
                COALESCE(SUM(CASE WHEN (status = 'redeemed' OR redeemed_at IS NOT NULL) THEN 1 ELSE 0 END), 0) as used_count,
                COALESCE(SUM(CASE WHEN ((status != 'redeemed' AND redeemed_at IS NULL) AND (status = 'expired' OR (status = 'active' AND expires_at <= ?))) THEN 1 ELSE 0 END), 0) as expired_count
            ", [$nowUtc, $nowUtc])
            ->first();

        $summary = [
            'active' => (int) ($summaryData?->active_count ?? 0),
            'used' => (int) ($summaryData?->used_count ?? 0),
            'expired' => (int) ($summaryData?->expired_count ?? 0),
        ];

        return [
            'paginator' => $paginator,
            'summary' => $summary,
        ];
    }

    /**
     * Retrieves a single voucher belonging to the authenticated customer.
     * Returns null if not found or belongs to another customer.
     */
    public function getCustomerVoucher(int $customerId, int $voucherId): ?Voucher
    {
        return Voucher::query()
            ->where('id', $voucherId)
            ->where('customer_id', $customerId)
            ->with(['merchant'])
            ->first();
    }
}
