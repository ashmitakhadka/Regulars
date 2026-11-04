<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


class PurchaseTransaction extends Model
{
    protected $fillable = [
        'merchant_id',
        'customer_id',
        'total_amount',
        'currency',
        'reference',
        'status',
        'verification_method',
        'verified_by',
        'purchased_at',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'purchased_at' => 'datetime',
            'verified_at' => 'datetime',
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

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
    public function items(): HasMany
{
    return $this->hasMany(PurchaseItem::class);
}
public function purchaseItems(): HasMany
{
    return $this->hasMany(PurchaseItem::class);
}
}
