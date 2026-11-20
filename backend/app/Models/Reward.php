<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reward extends Model
{
    protected $fillable = [
        'program_version_id',
        'earning_rule_product_id',
        'title',
        'description',
        'reward_type',
        'reward_value',
        'stamps_required',
        'voucher_validity_days',
    ];

    protected function casts(): array
    {
        return [
            'reward_value' => 'decimal:2',
            'stamps_required' => 'integer',
        ];
    }

    public function programVersion(): BelongsTo
    {
        return $this->belongsTo(
            LoyaltyProgramVersion::class,
            'program_version_id'
        );
    }

    public function earningRuleProduct(): BelongsTo
    {
        return $this->belongsTo(EarningRuleProduct::class);
    }
}