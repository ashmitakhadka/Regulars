<?php

namespace App\Http\Resources\Customer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerBusinessDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Excludes owner details, passwords, and QR tokens.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->business_name,
            'business_name' => $this->business_name,
            'slug' => $this->slug,
            'category' => $this->category,
            'description' => $this->description,
            'address' => $this->address,
            'phone' => $this->phone,
            'logo' => $this->logo,
            'programs' => $this->loyaltyPrograms->map(function ($program) {
                $activeVersion = $program->versions->where('status', 'active')->first()
                    ?? $program->versions->first();

                $earningRule = $activeVersion?->earningRule;
                $reward = $activeVersion?->reward;

                $card = $program->stampCards->first();

                $earningMethod = $earningRule?->earning_type;
                $isVisit = $earningMethod === 'visit';

                return [
                    'id' => $program->id,
                    'name' => $program->name,
                    'description' => $program->description,
                    'earning_method' => $earningMethod,
                    'stamps_required' => $isVisit && $earningRule?->threshold !== null
                        ? (int) $earningRule->threshold
                        : null,
                    'threshold' => $earningRule?->threshold !== null
                        ? (float) $earningRule->threshold
                        : null,
                    'reward_title' => $reward?->title,
                    'reward_description' => $reward?->description,
                    'reward' => $reward ? [
                        'title' => $reward->title,
                        'description' => $reward->description,
                        'reward_type' => $reward->reward_type,
                        'reward_value' => $reward->reward_value !== null ? (float) $reward->reward_value : null,
                        'voucher_validity_days' => (int) $reward->voucher_validity_days,
                    ] : null,
                    'already_joined' => $card !== null,
                    'joined' => $card !== null,
                    'card_id' => $card?->id,
                ];
            })->values(),
        ];
    }
}
