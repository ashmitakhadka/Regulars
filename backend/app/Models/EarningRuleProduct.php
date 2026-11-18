<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class EarningRuleProduct extends Model
{
    protected $fillable = [
        'earning_rule_id',
        'product_id',
        'quantity_required',
    ];

    public function earningRule(): BelongsTo
    {
        return $this->belongsTo(EarningRule::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function reward(): HasOne
    {
        return $this->hasOne(Reward::class);
    }
}