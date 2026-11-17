<?php

namespace App\Services\Customer;

use App\Http\Requests\Customer\CustomerLoginRequest;
use App\Http\Requests\Customer\CustomerRegisterRequest;
use App\Http\Resources\Customer\CustomerResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class CustomerAuthService
{
    /**
     * Register a new customer, establish session, and return profile.
     */
    public function register(CustomerRegisterRequest $request): JsonResponse
    {
        // Rate limit: 5 attempts per minute per IP
        $ipKey = 'customer_register:' . $request->ip();
        if (RateLimiter::tooManyAttempts($ipKey, 5)) {
            $seconds = RateLimiter::availableIn($ipKey);
            return response()->json([
                'success' => false,
                'message' => "Too many registration attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }
        RateLimiter::hit($ipKey, 60);

        $validated = $request->validated();

        // Note: The User model casts 'password' => 'hashed', so we pass the raw password directly.
        // CustomerUserObserver automatically generates and sets 'customer_code'.
        $user = User::create([
            'name' => $validated['name'],
            'email' => Str::lower($validated['email']),
            'password' => $validated['password'],
            'phone' => $validated['phone'],
            'role' => 'customer',
        ]);

        Auth::guard('web')->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'success' => true,
            'data' => new CustomerResource($user),
            'message' => 'Customer registered successfully.',
        ], 201);
    }

    /**
     * Authenticate customer with email and password, establish session, and return profile.
     */
    public function login(CustomerLoginRequest $request): JsonResponse
    {
        $normalizedEmail = Str::lower($request->input('email'));
        $throttleKey = 'customer_login:' . $normalizedEmail . '|' . $request->ip();

        // Rate limit check before verifying credentials (10 failed attempts per minute)
        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        $user = User::where('email', $normalizedEmail)->first();

        // Reject if user does not exist, role is not customer, or password does not match
        if (! $user || $user->role !== 'customer' || ! Hash::check($request->input('password'), $user->password)) {
            RateLimiter::hit($throttleKey, 60);

            return response()->json([
                'success' => false,
                'message' => 'Email or password is incorrect',
            ], 401);
        }

        // Reset rate limiter on successful authentication
        RateLimiter::clear($throttleKey);

        Auth::guard('web')->login($user);
        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'success' => true,
            'data' => new CustomerResource($user),
            'message' => 'Customer logged in successfully.',
        ], 200);
    }

    /**
     * Terminate the customer session.
     */
    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'success' => true,
            'data' => null,
            'message' => 'Customer logged out successfully.',
        ], 200);
    }

    /**
     * Return the authenticated customer profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new CustomerResource($request->user()),
            'message' => 'Customer profile retrieved successfully.',
        ], 200);
    }
}
