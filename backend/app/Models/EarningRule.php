<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EarningRule extends Model
{
    protected $fillable = [
        'program_version_id',
        'earning_type',
        'threshold',
        'stamps_awarded',
        'daily_stamp_limit',
    ];

    protected function casts(): array
    {
        return [
            'threshold' => 'decimal:2',
        ];
    }

    public function programVersion(): BelongsTo
    {
        return $this->belongsTo(
            LoyaltyProgramVersion::class,
            'program_version_id'
        );
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(
            Product::class,
            'earning_rule_products',
            'earning_rule_id',
            'product_id'
        );
    }

    public function tiers(): HasMany
    {
        return $this->hasMany(EarningRuleTier::class);
    }

    public function productRules(): HasMany
    {
        return $this->hasMany(EarningRuleProduct::class);
    }
}
