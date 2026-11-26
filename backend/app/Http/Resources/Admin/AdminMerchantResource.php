<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminMerchantResource extends JsonResource
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
            'status' => $this->status,
            'is_pro' => (bool) $this->is_pro,
            'owner' => [
                'name' => $this->user?->name,
                'email' => $this->user?->email,
            ],
            'created_at' => $this->created_at?->toISOString(),
            'programs_count' => (int) ($this->programs_count ?? 0),
            'customers_count' => (int) ($this->customers_count ?? 0),
        ];
    }
}
