<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StampTransaction extends Model
{
    protected $fillable = [
        'stamp_card_id',
        'program_version_id',
        'source_type',
        'source_id',
        'stamps_awarded',
        'earning_rule_product_id',
        'earning_rule_tier_id',
        'awarded_by_user_id',
        'idempotency_key',
    ];

    public function stampCard(): BelongsTo
    {
        return $this->belongsTo(StampCard::class);
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

    public function earningRuleTier(): BelongsTo
    {
        return $this->belongsTo(EarningRuleTier::class);
    }

    public function awardedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'awarded_by_user_id');
    }
}