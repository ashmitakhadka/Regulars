<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MerchantRegistrationRequest;
use App\Models\User;
use App\Models\Merchant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MerchantRegistrationController extends Controller
{
    public function store(MerchantRegistrationRequest $request)
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated) {

            // Create merchant user account
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => 'merchant',
            ]);

            // Generate unique business slug
            $slug = Str::slug($validated['business_name']);

            $originalSlug = $slug;
            $count = 1;

            while (Merchant::where('slug', $slug)->exists()) {
                $slug = $originalSlug . '-' . $count;
                $count++;
            }

            // Create merchant profile
            $user->merchant()->create([
                'business_name' => $validated['business_name'],
                'slug' => $slug,
                'phone' => $validated['phone'],
                'address' => $validated['address'],
                'description' => $validated['description'] ?? null,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Merchant registered successfully. Please log in.',
        ], 201);
    }
}
