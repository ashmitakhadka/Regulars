<?php

namespace App\Models;
use App\Models\User;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Attributes\Fillable;

#[Fillable([
    'user_id',
    'business_name',
    'slug',
    'description',
    'phone',
    'address',
])]

class Merchant extends Model
{
    public function user()
{
    return $this->belongsTo(User::class);
}
public function loyaltyPrograms(): HasMany
{
    return $this->hasMany(LoyaltyProgram::class);
}
public function qrCodes(): HasMany
{
    return $this->hasMany(MerchantQrCode::class);
}
public function purchaseTransactions(): HasMany
{
    return $this->hasMany(PurchaseTransaction::class);
}
public function products(): HasMany
{
    return $this->hasMany(Product::class);
}
public function customerStats(): HasMany
{
    return $this->hasMany(UserMerchantStat::class);
}
public function vouchers(): HasMany
{
    return $this->hasMany(Voucher::class);
}
public function promotions(): HasMany
{
    return $this->hasMany(Promotion::class);
}
public function targetedOffers(): HasMany
{
    return $this->hasMany(TargetedOffer::class);
}
}
