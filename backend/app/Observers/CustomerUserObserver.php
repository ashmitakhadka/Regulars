<?php

namespace App\Observers;

use App\Models\User;
use App\Services\Customer\CustomerCodeGenerator;

class CustomerUserObserver
{
    public function creating(User $user): void
    {
        if ($user->role === 'customer' && empty($user->customer_code)) {
            $user->customer_code = app(CustomerCodeGenerator::class)->generate();
        }
    }
}

