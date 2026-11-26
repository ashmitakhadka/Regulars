<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateMerchantProRequest;
use App\Http\Requests\Admin\UpdateMerchantStatusRequest;
use App\Services\Admin\AdminMerchantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminMerchantController extends Controller
{
    public function __construct(
        protected AdminMerchantService $merchantService
    ) {}

    public function index(Request $request): JsonResponse
    {
        return $this->merchantService->listMerchants($request);
    }

    public function show(int $id): JsonResponse
    {
        return $this->merchantService->getMerchant($id);
    }

    public function updateStatus(int $id, UpdateMerchantStatusRequest $request): JsonResponse
    {
        return $this->merchantService->updateStatus($id, $request);
    }

    public function updatePro(int $id, UpdateMerchantProRequest $request): JsonResponse
    {
        return $this->merchantService->updatePro($id, $request);
    }
}
