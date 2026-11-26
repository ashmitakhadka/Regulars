<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminMerchantDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'business_name' => $this->business_name,
            'slug' => $this->slug,
            'category' => $this->category,
            'description' => $this->description,
            'phone' => $this->phone,
            'address' => $this->address,
            'timezone' => $this->timezone,
            'currency' => $this->currency,
            'status' => $this->status,
            'is_pro' => (bool) $this->is_pro,
            'owner' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ],
            'created_at' => $this->created_at?->toISOString(),
            'stats' => [
                'programs_total' => (int) ($this->additional_stats['programs_total'] ?? 0),
                'programs_active' => (int) ($this->additional_stats['programs_active'] ?? 0),
                'customers_count' => (int) ($this->additional_stats['customers_count'] ?? 0),
                'stamps_awarded' => (int) ($this->additional_stats['stamps_awarded'] ?? 0),
                'vouchers_issued' => (int) ($this->additional_stats['vouchers_issued'] ?? 0),
                'vouchers_redeemed' => (int) ($this->additional_stats['vouchers_redeemed'] ?? 0),
            ],
            'recent_activity' => $this->recent_activity ?? [],
        ];
    }
}
