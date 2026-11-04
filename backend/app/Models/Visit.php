<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Visit extends Model
{
    protected $fillable = [
        'merchant_id',
        'customer_id',
        'merchant_qr_code_id',
        'scanned_at',
        'local_date',
        'timezone',
        'status',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'scanned_at' => 'datetime',
            'local_date' => 'date',
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

    public function merchantQrCode(): BelongsTo
    {
        return $this->belongsTo(MerchantQrCode::class);
    }
}
