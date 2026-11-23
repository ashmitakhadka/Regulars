<?php

namespace App\Http\Resources\Customer;

use App\Services\Customer\CustomerVoucherService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerVoucherDetailResource extends JsonResource
{
    /**
     * Transform the detailed voucher resource into an array.
     * Includes full reward snapshot without leaking internal or merchant staff details.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $merchant = $this->merchant;
        $tz = $merchant?->timezone ?: 'Asia/Kathmandu';

        $effectiveStatus = CustomerVoucherService::getEffectiveStatus($this->resource, $tz);
        $daysLeft = CustomerVoucherService::calculateDaysLeft($this->resource, $effectiveStatus, $tz);
        $expiringSoon = CustomerVoucherService::isExpiringSoon($daysLeft, $effectiveStatus);

        $issuedAt = $this->issued_at ? Carbon::parse($this->issued_at)->setTimezone($tz) : null;
        $expiresAt = $this->expires_at ? Carbon::parse($this->expires_at)->setTimezone($tz) : null;
        $redeemedAt = $this->redeemed_at ? Carbon::parse($this->redeemed_at)->setTimezone($tz) : null;

        return [
            'id' => $this->id,
            'code' => $this->code,
            'status' => $effectiveStatus,
            'source' => CustomerVoucherService::mapSource($this->source_type),
            'reward_title' => $this->reward_title,
            'reward_description' => $this->reward_description,
            'reward_type' => $this->reward_type,
            'reward_value' => $this->reward_value !== null ? (float) $this->reward_value : null,
            'currency' => $this->currency ?: 'NPR',
            'business' => [
                'name' => $merchant?->business_name,
                'slug' => $merchant?->slug,
                'logo' => $merchant?->logo,
            ],
            'issued_at' => $issuedAt?->toIso8601String(),
            'expires_at' => $expiresAt?->toIso8601String(),
            'redeemed_at' => $redeemedAt?->toIso8601String(),
            'timezone' => $tz,
            'days_left' => $daysLeft,
            'expiring_soon' => $expiringSoon,
        ];
    }
}
