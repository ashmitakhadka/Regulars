<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TargetedOffer extends Model
{
    protected $fillable = [
    'merchant_id',
    'customer_id',
    'title',
    'description',
    'reward_type',
    'reward_description',
    'reward_value',
    'voucher_validity_days',
    'status',
    'offered_at',
    'claim_expires_at',
    'claimed_at',
    'voucher_id',
];

    protected function casts(): array
    {
        return [
            'reward_value' => 'decimal:2',
            'voucher_validity_days' => 'integer',
            'offered_at' => 'datetime',
            'claim_expires_at' => 'datetime',
            'claimed_at' => 'datetime',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function voucher(): BelongsTo
    {
        return $this->belongsTo(Voucher::class);
    }
}
