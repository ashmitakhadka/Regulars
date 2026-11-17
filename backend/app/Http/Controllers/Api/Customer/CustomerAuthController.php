<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\CustomerLoginRequest;
use App\Http\Requests\Customer\CustomerRegisterRequest;
use App\Services\Customer\CustomerAuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerAuthController extends Controller
{
    public function __construct(
        protected CustomerAuthService $authService
    ) {}

    public function register(CustomerRegisterRequest $request): JsonResponse
    {
        return $this->authService->register($request);
    }

    public function login(CustomerLoginRequest $request): JsonResponse
    {
        return $this->authService->login($request);
    }

    public function logout(Request $request): JsonResponse
    {
        return $this->authService->logout($request);
    }

    public function me(Request $request): JsonResponse
    {
        return $this->authService->me($request);
    }
}

