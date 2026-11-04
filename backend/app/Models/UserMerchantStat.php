<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserMerchantStat extends Model
{
    protected $fillable = [
        'customer_id',
        'merchant_id',
        'current_streak',
        'longest_streak',
        'last_qualifying_visit_date',
    ];

    protected function casts(): array
    {
        return [
            'last_qualifying_visit_date' => 'date',
            'current_streak' => 'integer',
            'longest_streak' => 'integer',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }
}
