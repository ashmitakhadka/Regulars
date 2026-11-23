<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ListVouchersRequest;
use App\Http\Resources\Customer\CustomerVoucherDetailResource;
use App\Http\Resources\Customer\CustomerVoucherResource;
use App\Services\Customer\CustomerVoucherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerVoucherController extends Controller
{
    public function __construct(
        protected CustomerVoucherService $voucherService
    ) {}

    /**
     * List authenticated customer's vouchers with optional status filter and summary counts.
     */
    public function index(ListVouchersRequest $request): JsonResponse
    {
        $customer = $request->user();
        $filters = $request->validated();

        $result = $this->voucherService->listCustomerVouchers($customer->id, $filters);
        $paginator = $result['paginator'];

        return response()->json([
            'success' => true,
            'data' => [
                'vouchers' => CustomerVoucherResource::collection($paginator->items()),
                'summary' => $result['summary'],
                'pagination' => [
                    'current_page' => $paginator->currentPage(),
                    'per_page' => $paginator->perPage(),
                    'total' => $paginator->total(),
                    'last_page' => $paginator->lastPage(),
                ],
            ],
            'message' => 'Vouchers retrieved successfully.',
        ]);
    }

    /**
     * Retrieve single voucher details for the authenticated customer.
     * Returns 404 if the voucher does not exist or belongs to another customer.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $customer = $request->user();
        $voucher = $this->voucherService->getCustomerVoucher($customer->id, $id);

        if (!$voucher) {
            return response()->json([
                'success' => false,
                'message' => 'Voucher not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'voucher' => new CustomerVoucherDetailResource($voucher),
            ],
            'message' => 'Voucher details retrieved successfully.',
        ]);
    }
}
