<?php

namespace App\Http\Resources\Customer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerBusinessListResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Excludes all private owner and QR data.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'business_name' => $this->business_name,
            'category' => $this->category,
            'short_description' => $this->description,
            'address' => $this->address,
            'logo' => $this->logo,
            'active_programs_count' => (int) ($this->active_programs_count ?? $this->loyalty_programs_count ?? 0),
        ];
    }
}
