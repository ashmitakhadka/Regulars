<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\Customer\CustomerBusinessDetailResource;
use App\Http\Resources\Customer\CustomerBusinessListResource;
use App\Http\Resources\Customer\CustomerProgramDetailResource;
use App\Services\Customer\CustomerBusinessService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerBusinessController extends Controller
{
    public function __construct(
        protected CustomerBusinessService $businessService
    ) {}

    /**
     * List active businesses with at least one active program.
     */
    public function index(Request $request): JsonResponse
    {
        $paginator = $this->businessService->listBusinesses($request);

        return response()->json([
            'success' => true,
            'data' => CustomerBusinessListResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'message' => 'Businesses retrieved successfully.',
        ]);
    }

    /**
     * Show details of a single active business and its active programs.
     */
    public function show(Request $request, string $slug): JsonResponse
    {
        $merchant = $this->businessService->getBusinessBySlug(
            $slug,
            (int) $request->user()->id
        );

        if (!$merchant) {
            return response()->json([
                'success' => false,
                'message' => 'Business not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new CustomerBusinessDetailResource($merchant),
            'message' => 'Business retrieved successfully.',
        ]);
    }

    /**
     * Show details of a single active loyalty program.
     */
    public function showProgram(Request $request, int $id): JsonResponse
    {
        $program = $this->businessService->getProgramById(
            $id,
            (int) $request->user()->id
        );

        if (!$program) {
            return response()->json([
                'success' => false,
                'message' => 'Program not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new CustomerProgramDetailResource($program),
            'message' => 'Program retrieved successfully.',
        ]);
    }
}
