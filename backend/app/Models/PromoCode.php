<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PromoCode extends Model
{
    protected $fillable = [
        'promotion_id',
        'code',
        'usage_limit',
        'usage_count',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'usage_limit' => 'integer',
            'usage_count' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    public function promotion(): BelongsTo
    {
        return $this->belongsTo(Promotion::class);
    }

    public function redemptions(): HasMany
    {
        return $this->hasMany(PromoCodeRedemption::class);
    }

}
