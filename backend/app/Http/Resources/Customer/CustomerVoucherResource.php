<?php

namespace App\Http\Resources\Customer;

use App\Services\Customer\CustomerVoucherService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerVoucherResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Never exposes raw internal merchant/owner fields or staff details.
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
