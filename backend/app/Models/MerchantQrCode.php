<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MerchantQrCode extends Model
{
    protected $fillable = [
        'merchant_id',
        'type',
        'token_hash',
        'is_active',
        'expires_at',
        'last_refreshed_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
            'last_refreshed_at' => 'datetime',
        ];
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function visits(): HasMany
    {
        return $this->hasMany(Visit::class);
    }
}
