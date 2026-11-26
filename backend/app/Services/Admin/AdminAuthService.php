<?php

namespace App\Services\Admin;

use App\Http\Requests\Admin\AdminLoginRequest;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AdminAuthService
{
    /**
     * Authenticate superadmin via cookie session.
     */
    public function login(AdminLoginRequest $request): JsonResponse
    {
        $email = Str::lower(trim((string) $request->input('email')));
        $password = (string) $request->input('password');

        // Independent rate limiting key for admin login
        $rateKey = 'admin-login:' . $email . '|' . $request->ip();

        if (RateLimiter::tooManyAttempts($rateKey, 5)) {
            $seconds = RateLimiter::availableIn($rateKey);
            return response()->json([
                'success' => false,
                'message' => "Too many login attempts. Please try again in {$seconds} seconds.",
            ], 429);
        }

        $user = User::where('email', $email)->first();

        // ONLY superadmin can log in. Wrong password, merchant, customer get identical 401.
        if (! $user || ! Hash::check($password, $user->password) || $user->role !== 'superadmin') {
            RateLimiter::hit($rateKey, 60);

            Log::info('[admin.login.failed] Admin login failed', [
                'email' => $email,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Email or password is incorrect.',
            ], 401);
        }

        RateLimiter::clear($rateKey);

        Auth::guard('web')->login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        Log::info('[admin.login.success] Admin login successful', [
            'admin_id' => $user->id,
            'email' => $user->email,
            'ip' => $request->ip(),
        ]);

        return response()->json([
            'success' => true,
            'data' => new AdminUserResource($user),
            'message' => 'Admin logged in successfully.',
        ], 200);
    }

    /**
     * Log out superadmin session.
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
            'message' => 'Admin logged out successfully.',
        ], 200);
    }

    /**
     * Return current authenticated superadmin profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new AdminUserResource($request->user()),
            'message' => 'Admin profile retrieved successfully.',
        ], 200);
    }
}
