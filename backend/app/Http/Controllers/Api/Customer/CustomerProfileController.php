<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\UpdateCustomerProfileRequest;
use App\Services\Customer\CustomerProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerProfileController extends Controller
{
    public function __construct(
        protected CustomerProfileService $profileService
    ) {}

    /**
     * Retrieve the authenticated customer's profile.
     */
    public function show(Request $request): JsonResponse
    {
        return $this->profileService->getProfile($request->user());
    }

    /**
     * Update the authenticated customer's name and phone.
     */
    public function update(UpdateCustomerProfileRequest $request): JsonResponse
    {
        return $this->profileService->updateProfile($request->user(), $request->validated());
    }
}
