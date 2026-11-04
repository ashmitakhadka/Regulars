<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Voucher extends Model
{
    protected $fillable = [
        'merchant_id',
        'customer_id',
        'stamp_card_id',
        'code',
        'source_type',
        'reward_title',
        'reward_description',
        'reward_type',
        'reward_value',
        'currency',
        'status',
        'issued_at',
        'expires_at',
        'redeemed_at',
    ];

    protected function casts(): array
    {
        return [
            'reward_value' => 'decimal:2',
            'issued_at' => 'datetime',
            'expires_at' => 'datetime',
            'redeemed_at' => 'datetime',
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

    public function stampCard(): BelongsTo
    {
        return $this->belongsTo(StampCard::class);
    }

    public function redemption(): HasOne
    {
        return $this->hasOne(VoucherRedemption::class);
    }
}
