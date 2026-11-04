
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reward extends Model
{
    protected $fillable = [
        'program_version_id',
        'title',
        'description',
        'reward_type',
        'reward_value',
        'voucher_validity_days',
    ];

    protected function casts(): array
    {
        return [
            'reward_value' => 'decimal:2',
        ];
    }

    public function programVersion(): BelongsTo
    {
        return $this->belongsTo(
            LoyaltyProgramVersion::class,
            'program_version_id'
        );
    }
}
