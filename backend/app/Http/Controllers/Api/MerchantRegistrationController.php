<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MerchantRegistrationRequest;
use App\Http\Requests\MerchantLoginRequest;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
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

    public function login(MerchantLoginRequest $request)
{
    $credentials = $request->validated();

    $user = User::where('email', $credentials['email'])->first();

    if (!$user || !Hash::check($credentials['password'], $user->password)) {
        return response()->json([
            'success' => false,
            'message' => 'Invalid email or password.',
        ], 401);
    }

    if ($user->role !== 'merchant') {
        return response()->json([
            'success' => false,
            'message' => 'This account is not registered as a merchant.',
        ], 403);
    }

    $merchant = \App\Models\Merchant::where('user_id', $user->id)->first();

    if (!$merchant || $merchant->status !== 'active') {
        return response()->json([
            'success' => false,
            'message' => 'Your merchant account is not active.',
        ], 403);
    }

    $token = $user->createToken('merchant-token')->plainTextToken;

    return response()->json([
        'success' => true,
        'message' => 'Merchant login successful!',
        'token' => $token,
        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
        ],
        'merchant' => [
            'id' => $merchant->id,
            'business_name' => $merchant->business_name,
            'slug' => $merchant->slug,
        ],
    ], 200);
}
}
