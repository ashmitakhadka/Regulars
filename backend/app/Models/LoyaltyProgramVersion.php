<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class LoyaltyProgramVersion extends Model
{
    protected $fillable = [
        'loyalty_program_id',
        'version_number',
        'status',
        'effective_at',
    ];

    protected function casts(): array
    {
        return [
            'effective_at' => 'datetime',
        ];
    }

    public function loyaltyProgram(): BelongsTo
    {
        return $this->belongsTo(LoyaltyProgram::class);
    }

    public function earningRule(): HasOne
    {
        return $this->hasOne(EarningRule::class, 'program_version_id');
    }

    public function reward(): HasOne
    {
        return $this->hasOne(Reward::class, 'program_version_id');
    }
}
