<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\BulkJoinProgramsRequest;
use App\Http\Resources\Customer\StampCardJoinResource;
use App\Services\Customer\CustomerJoinService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerJoinController extends Controller
{
    public function __construct(
        protected CustomerJoinService $joinService
    ) {}

    /**
     * Join an individual active loyalty program.
     * Returns:
     * - 201: Fresh stamp card created.
     * - 200: Customer already has an active card for this program.
     * - 404: Program not found, inactive, archived, or business suspended.
     */
    public function join(Request $request, int|string $id): JsonResponse
    {
        $customerId = (int) $request->user()->id;
        $result = $this->joinService->joinProgram($customerId, (int) $id);

        if ($result === null) {
            return response()->json([
                'success' => false,
                'message' => 'Program not found.',
            ], 404);
        }

        if ($result['already_joined']) {
            return response()->json([
                'success' => true,
                'data' => [
                    'already_joined' => true,
                    'card' => new StampCardJoinResource($result['card']),
                ],
                'message' => 'You have already joined this loyalty program.',
            ], 200);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'already_joined' => false,
                'card' => new StampCardJoinResource($result['card']),
            ],
            'message' => 'Joined loyalty program successfully.',
        ], 201);
    }

    /**
     * Join multiple loyalty programs in bulk.
     * Processes each program in its own transaction and preserves the input ordering.
     */
    public function bulkJoin(BulkJoinProgramsRequest $request): JsonResponse
    {
        $customerId = (int) $request->user()->id;
        $programIds = $request->validated('program_ids');

        $results = $this->joinService->joinMultiplePrograms($customerId, $programIds);

        return response()->json([
            'success' => true,
            'data' => [
                'results' => $results,
            ],
            'message' => 'Programs processed successfully.',
        ], 200);
    }
}
