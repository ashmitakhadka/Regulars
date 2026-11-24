<?php

namespace App\Http\Resources\Customer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StampCardJoinResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Excludes owner details and QR tokens.
     */
    public function toArray(Request $request): array
    {
        $program = $this->loyaltyProgram;
        $merchant = $program?->merchant;

        return [
            'id' => $this->id,
            'status' => $this->status,
            'stamps_earned' => (int) $this->stamps_earned,
            'started_at' => $this->started_at?->toISOString(),
            'program' => [
                'id' => $program?->id,
                'name' => $program?->name,
            ],
            'business' => [
                'id' => $merchant?->id,
                'name' => $merchant?->business_name,
                'slug' => $merchant?->slug,
            ],
        ];
    }
}
