
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
}
