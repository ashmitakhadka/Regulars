<?php

namespace App\Services\Customer;

use App\Http\Resources\Customer\CustomerProfileResource;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;

class CustomerProfileService
{
    /**
     * Return the authenticated customer profile.
     */
    public function getProfile(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new CustomerProfileResource($user),
            'message' => 'Customer profile retrieved successfully.',
        ], 200);
    }

    /**
     * Update ONLY name and phone explicitly.
     * All extraneous fields are discarded.
     * Catches race-condition unique constraint violations on phone and returns 422.
     */
    public function updateProfile(User $user, array $validated): JsonResponse
    {
        $user->name = $validated['name'];
        $user->phone = $validated['phone'];

        try {
            $user->save();
        } catch (UniqueConstraintViolationException|QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'The phone has already been taken.',
                'errors' => [
                    'phone' => ['The phone has already been taken.'],
                ],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => new CustomerProfileResource($user),
            'message' => 'Profile updated successfully.',
        ], 200);
    }
}
