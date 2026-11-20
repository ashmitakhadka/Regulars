<?php

namespace App\Http\Resources\Customer;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerProgramDetailResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Excludes owner details and QR tokens.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $activeVersion = $this->versions->where('status', 'active')->first()
            ?? $this->versions->first();

        $earningRule = $activeVersion?->earningRule;
        $reward = $activeVersion?->reward;

        $card = $this->stampCards->first();

        $earningMethod = $earningRule?->earning_type;
        $isVisit = $earningMethod === 'visit';

        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'business_name' => $this->merchant?->business_name,
            'business_slug' => $this->merchant?->slug,
            'earning_method' => $earningMethod,
            'stamps_required' => $isVisit && $earningRule?->threshold !== null
                ? (int) $earningRule->threshold
                : null,
            'threshold' => $earningRule?->threshold !== null
                ? (float) $earningRule->threshold
                : null,
            'reward_title' => $reward?->title,
            'reward_description' => $reward?->description,
            'reward_type' => $reward?->reward_type,
            'voucher_validity_days' => $reward ? (int) $reward->voucher_validity_days : null,
            'reward' => $reward ? [
                'title' => $reward->title,
                'description' => $reward->description,
                'reward_type' => $reward->reward_type,
                'reward_value' => $reward->reward_value !== null ? (float) $reward->reward_value : null,
                'voucher_validity_days' => (int) $reward->voucher_validity_days,
            ] : null,
            'already_joined' => $card !== null,
            'joined' => $card !== null,
            'my_card' => $card ? [
                'card_id' => $card->id,
                'stamps_earned' => (int) $card->stamps_earned,
                'status' => $card->status,
            ] : null,
        ];
    }
}
