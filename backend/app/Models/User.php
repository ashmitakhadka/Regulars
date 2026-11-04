<?php

namespace App\Models;
use App\Models\Merchant;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name', 'email', 'password', 'role'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    public function merchant()
{
    return $this->hasOne(Merchant::class);
}
public function merchantStats(): HasMany
{
    return $this->hasMany(UserMerchantStat::class, 'customer_id');
}
public function vouchers(): HasMany
{
    return $this->hasMany(Voucher::class, 'customer_id');
}
public function targetedOffers(): HasMany
{
    return $this->hasMany(TargetedOffer::class, 'customer_id');
}
}
