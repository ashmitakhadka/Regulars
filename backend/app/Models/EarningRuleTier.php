<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EarningRuleTier extends Model
{
    protected $fillable = [
        'earning_rule_id',
        'min_amount',
        'max_amount',
        'stamps_awarded',
    ];

    protected function casts(): array
    {
        return [
            'min_amount' => 'decimal:2',
            'max_amount' => 'decimal:2',
        ];
    }

    public function earningRule(): BelongsTo
    {
        return $this->belongsTo(EarningRule::class);
    }
}